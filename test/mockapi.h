#pragma once

#include <string>
#include <cstdio>

void hellovoid();
int helloint();
int helloinc(int v);
std::string concat(std::string a, std::string b);

class TestClass {
public:
	TestClass() { printf("constructing!!!\n"); val=5; }
	~TestClass() { printf("destructing!!!\n"); }
	int getVal() { return val; }
	void setVal(int val_) { val=val_; }
private:
	int val;
};
