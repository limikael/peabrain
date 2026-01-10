#include <stdio.h>

void test_quickjs();
void test_canopener();
void test_peabind();

int main() {
	printf("Running tests...\n");

	test_quickjs();
	test_canopener();
	test_peabind();

	return 0;
}