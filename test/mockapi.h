#pragma once

#include <string>
#include <cstdio>

void hellovoid();
int helloint();
int helloinc(int v);
std::string concat(std::string a, std::string b);

class TestClass {
public:
	TestClass() { printf("constructing!!!\n"); }
	~TestClass() { printf("destructing!!!\n"); }
};
