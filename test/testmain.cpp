#include <stdio.h>

void test_quickjs();
void test_canopener();
void test_peabind();
void test_peabind_classes();
void test_peabind_references();

int main() {
	printf("Running tests...\n");

	test_quickjs();
	test_canopener();
	test_peabind();
	test_peabind_classes();
	test_peabind_references();

	return 0;
}