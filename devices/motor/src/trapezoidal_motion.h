#pragma once

typedef struct {
    float current_pos;
    float current_vel;
    float target_pos;
    float max_vel;
    float max_accel;
    float max_decel;
} trapezoidal_motion_t;

void update_trapezoidal_motion(trapezoidal_motion_t* state, float dt);