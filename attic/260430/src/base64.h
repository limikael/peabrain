#pragma once

size_t base64_decode(const char *in, size_t in_len, uint8_t *out);
size_t base64_get_max_decoded_size(size_t input_length);
