#pragma once
#include <vector>
#include <functional>

template<typename... Args>
class Dispatcher {
    struct Listener {
        int id;
        std::function<void(Args...)> fn;
        void *identity;
        std::function<void()> destructor;
    };

    std::vector<Listener> listeners;
    int nextId = 1;

public:
    ~Dispatcher() {
        printf("destructing dispatcher...\n");
        off();
    }

    int on(std::function<void(Args...)> listener) {
        int id = nextId++;
        listeners.push_back({id, std::move(listener), nullptr, nullptr});
        return id;
    }

    void setDestructor(int id, std::function<void()> destructor) {
        for (auto it = listeners.begin(); it != listeners.end(); ++it) {
            if (it->id == id) {
                it->destructor=std::move(destructor);
            }
        }
    }


    int getIdByIdentity(void *identity) {
        for (auto it = listeners.begin(); it != listeners.end(); ++it) {
            if (it->identity == identity) {
                return it->id;
            }
        }

        return 0;
    }

    void setIdentity(int id, void *identity) {
        for (auto it = listeners.begin(); it != listeners.end(); ++it) {
            if (it->id == id) {
                it->identity=identity;
            }
        }
    }

    void off(int id) {
        for (auto it = listeners.begin(); it != listeners.end(); ++it) {
            if (it->id == id) {
                if (it->destructor)
                    it->destructor();
                listeners.erase(it);
                return;
            }
        }
    }

    void off() {
        for (auto it = listeners.begin(); it != listeners.end(); ++it) {
            if (it->destructor)
                it->destructor();
        }

        listeners.clear();
    }

    void emit(Args... args) {
        auto copy = listeners;
        for (auto& l : copy) {
            l.fn(args...);
        }
    }
};
