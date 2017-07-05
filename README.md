This package is is an xUnit inspired unit testing framework.

Given that `SLE`'s idiomatic style is functional it is possible to create a unit testing framework which is 
significantly simpler than side-effect unit testing frameworks.  The reason for this is that, without code being able to 
throw any exceptions or impose any side-effects, it is possible to calculate the result of a unit test without that test 
sabotaging the other tests within the suite.
 
Using an ADT style a collection of tests can be described as
 
```haskell
type UnitTest = Suite String * List UnitTest | Test String * Assertion 
```
 
An ADT style `Assertion` with functions would then look like this:

```haskell
type Assertion = AllGood | Fail String where
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

