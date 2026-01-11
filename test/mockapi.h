#pragma once

#include <string>
#include <cstdio>

void hellovoid();
int helloint();
int helloinc(int v);
std::string concat(std::string a, std::string b);

class TestClass {
public:
	TestClass(int val_) { printf("constructing!!!\n"); val=val_; }
	~TestClass() { printf("destructing!!!\n"); }
	int getVal() { return val; }
	void setVal(int val_) { val=val_; }
private:
	int val;
};

TestClass *createTestClass(int val_);
int getTestClassValue(TestClass *t);
