#include "mockapi.h"

int helloint() {
	return 123;
}

int helloinc(int v) {
	return v+1;
}

void hellovoid() {

}

std::string concat(std::string a, std::string b) {
	return a+b;
}

TestClass *createTestClass(int val) {
	return new TestClass(val);
}

int getTestClassValue(TestClass* t) {
	return t->getVal();
}

int getTestClassValueRef(TestClass& t) {
	return t.getVal();
}
