This package is is an xUnit inspired unit testing framework.

Given that `sle`'s idiomatic style is functional it is possible to create a unit testing framework which is 
significantly simpler than side-effect unit testing frameworks.  The reason for this is that, without code being able to 
throw any exceptions or impose any side-effects, it is possible to calculate the result of a unit test without that test 
sabotaging the other tests within the suite.
 
Using an ADT style a collection of tests can be described as
 
```haskell
data UnitTest = Suite String * List UnitTest | Test String * Assertion 
```
 
An ADT style `Assertion` with functions would then look like this:

```haskell
data Assertion = AllGood | Fail String where
    isTrue :: Boolean -> Assertion
    isTrue b = case self of
        AllGood 
            | b -> AllGood
            | not b -> Fail "isTrue failed"
        else -> self
        
    equals :: t -> t -> Assertion
    equals a b = case self of
        AllGood 
            | a == b -> AllGood
            | a != b -> Fail ("equals failed: " ++ a.show() ++ " != " ++ b.show())
        else -> self
    
    isAllGood :: () -> Boolean
    isAllGood = case self of
        AllGood -> true
        else -> false
```

In this style the assertion "framework" is super simple - assertions can be chained together with the first assertion
that fails being that one that is recorded as the unit test result.

The syntax will be weired because I am using a hybrid between Haskell with the object notion of `self`.  Please keep in
mind that, even though this has an object smell to it, instances of type are immutable and the state of a type is
completely captured by the ADT.

Now that I have the ability to make assertions the `Test` then becomes nothing more than a populated ADT.  The output
that we're accustomed to seeing is nothing more than a view of this structure.  For example, to see the total number of
tests defined:

```haskell
totalTests :: UnitTest -> Int
totalTests test = case test of
    Unit name assertion -> 1
    Suite name tests -> tests.fold 0 (\acc \test -> acc + (totalTests test))    
```

Similarly we can total up the number of tests that passed using

```haskell
passedTests :: UnitTest -> Int
passedTests test = case test of
    Test name assertion
        | assertion.isAllGood() -> 1
        | else -> 0
    Suite name tests -> tests.fold 0 (\acc \test -> acc + (passedTests test))
```

## Rethinking Assertion

Looking at the above it is clear that `Assertion` can be expanded to offer more functionality.  However taking a 
perspective from `UnitTest` and the functions that operate over an instance of `UnitTest`, all that is required is the 
function method

```haskell
Assertion a => isAllGood :: () -> Boolean 
```

Although not defined explicitly being able to use pattern matching over the `Assertion` type is way to extract the 
`String` reason associated with a failed `Assertion`.  By adding the ability to extract a fail message off of an
`Assertion` it is possible to express the `Assertion` as an interface rather than an ADT type.  Doing so we now end up
with

```haskell
type Assertion where
    isAllGood :: () -> Boolean
    failMessage :: () -> Maybe String
```

Replacing this with an interface it allows us to create different implementations of `Assertion` depending on the  style 
that is important to the particular developer.  For example it is now possible to create a type which implements this 
interface but is the xUnit assertion style whilst another implementation might offer a BBD style of assertions.
 
An issue though with this interface is that it is only able to accommodate synchronous assertions.  By rewriting this
into a Promises style it is then possible for assertions to accommodate asynchronous assertions.  If I then rewrite
the above interface to appear as follows:

```haskell
type Assertion = Promises String ()
```

A failed promise of String is then the failed assertion's message whilst a successful assertion is represented as a 
promise of `()`.  The function for `totalTests` does not change and can still operation in a synchronous manner.  The 
function for `passedTests` however changes to have the following signature:
 
```haskell
passedTests :: UnitTest -> Promise _ Int
```

The implementation of this function is relatively simple.

```haskell
passedTests :: UnitTest -> Promise _ Int
passedTests test = 
    allAssertions test = case test of
        Test name assertion -> [assertion]
        Suite name tests -> tests.fold [] (\acc \test -> acc ++ (passedTests test))

    Promise.all ((allAssertions test).map (_.then(constant 1).catch(constant 0))).then(_.foldl 0 (+))
```

This style then has the following benefits:

* It unifies synchronous and asynchronous unit tests
* Idiomatic `sle` dictates that all side-effects are captured within a promise.  Using this style it is possible to deal
  with side-effects in a consistent manner.  Example of side-effects are random numbers for generative tests, reading
  and writing of files and other integrated actions like invoking services of integrating into persistent stores
* This style still supports the ability to have multiple implementations accommodating different styles and tastes of
  formulating assertions
  
  
## Rethinking Unit Test

The style of a unit test being nothing more than an ADT is useful however it has the following shortcoming: I am unable 
to create a collection of unit tests off of a promises centered file system.  So rather than my assertions being a 
`Promise` I make each suite be a `Promise`.  In this way a unit test is now a simple ADT with simple assertions.

So now we have the ADT being described as

```haskell
data UnitTest = Suite String * List (Promise _ UnitTest) | Test String * Assertion
``` 

With my assertion taking the form of

```haskell
data Assertion = AllGood | Fail String where
    isTrue :: Boolean -> Assertion
    isTrue b = case self of
        AllGood 
            | b -> AllGood
            | not b -> Fail "isTrue failed"
        else -> self
        
    equals :: t -> t -> Assertion
    equals a b = case self of
        AllGood 
            | a == b -> AllGood
            | a != b -> Fail ("equals failed: " ++ a.show() ++ " != " ++ b.show())
        else -> self
    
    isAllGood :: () -> Boolean
    isAllGood = case self of
        AllGood -> true
        else -> false
```

A collection of tests is now of the type `Promise _ UnitTest` and all operations are now rewritten against a promises
style unit test rather than a promises style assertion.  The assertions signature returns to

```haskell
type Assertion where
    isAllGood :: () -> Boolean
    failMessage :: () -> Maybe String
```

Similarly the function `totalTests` now changes to

```haskell
totalTests :: Promise _ UnitTest -> Promise _ Int
totalTests testPromise = 
    testPromise.then (\test -> 
        case test of
            Unit name assertion -> 1
            Suite name tests -> Promise.all(tests.map totalTesys).fold 0 (\acc \test -> acc + test))    

```

Finally `passedTests` has a similar shape to `totalTests`

```haskell
passedTests :: Promise _ UnitTest -> Promise _ Int
passedTests testPromise = 
    testPromise.then (\test ->
        case test of
            Unit name assertion -> if assertion.isAllGood() then 1 else 0
            Suite name tests -> Promise.all(test.map passedTests).fold 0 (\acc \test -> acc + test))
```

