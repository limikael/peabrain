#include <stdio.h>

void test_quickjs();
void test_canopener();
void test_peabind();
void test_peabind_classes();
void test_peabind_references();
void test_peabind_borrowed_references();
void test_peabind_assigner();
void test_peabind_callbacks();
void test_peabind_events();

int main() {
	printf("Running tests...\n");

	test_quickjs();
	test_canopener();
	test_peabind();
	test_peabind_classes();
	test_peabind_references();
	test_peabind_borrowed_references();
	test_peabind_assigner();
	test_peabind_callbacks();
	test_peabind_events();

	return 0;
}