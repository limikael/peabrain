class IdleTimer {
public:
    IdleTimer(uint32_t windowMs)
        : window(windowMs), last(0) {}

    void touch() {
        last = millis();
    }

    bool active() const {
        return (millis() - last) < window;
    }

private:
    uint32_t window;
    uint32_t last;
};