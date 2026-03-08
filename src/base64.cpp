#include <stdint.h>
#include <stddef.h>

static inline int8_t b64_value(char c) {
    if (c >= 'A' && c <= 'Z') return c - 'A';
    if (c >= 'a' && c <= 'z') return c - 'a' + 26;
    if (c >= '0' && c <= '9') return c - '0' + 52;
    if (c == '+') return 62;
    if (c == '/') return 63;
    return -1;
}

size_t base64_decode(const char *in, size_t in_len, uint8_t *out) {
    size_t i;
    size_t j = 0;

    for (i = 0; i < in_len; i += 4)
    {
        int8_t a = b64_value(in[i]);
        int8_t b = b64_value(in[i+1]);
        int8_t c = (in[i+2] == '=') ? 0 : b64_value(in[i+2]);
        int8_t d = (in[i+3] == '=') ? 0 : b64_value(in[i+3]);

        uint32_t v = (a << 18) | (b << 12) | (c << 6) | d;

        out[j++] = (v >> 16) & 0xFF;

        if (in[i+2] != '=')
            out[j++] = (v >> 8) & 0xFF;

        if (in[i+3] != '=')
            out[j++] = v & 0xFF;
    }

    return j;
}

size_t base64_get_max_decoded_size(size_t input_length) {
    return (input_length / 4) * 3;
}