#include "trapezoidal_motion.h"
#include <math.h>

// One function to rule them all - stateless trapezoidal profile
void update_trapezoidal_motion(trapezoidal_motion_t* state, float dt) {
    float distance = state->target_pos - state->current_pos;
    float distance_abs = fabsf(distance);
    
    if (distance_abs < 0.001f) {
        // At target
        state->current_vel = 0.0f;
        state->current_pos = state->target_pos;
        return;
    }
    
    // Calculate the velocity profile for remaining distance
    // This is the core of the stateless algorithm
    
    // 1. What's the maximum velocity we could stop from in remaining distance?
    float max_vel_from_decel = sqrtf(2.0f * state->max_decel * distance_abs);
    
    // 2. What velocity would we like ideally?
    float desired_vel_profile;
    
    // Check if we would reach max_vel in the available distance
    // Distance needed to accelerate from current_vel to max_vel and then decelerate to 0:
    float accel_dist = (state->max_vel * state->max_vel - 
                       state->current_vel * state->current_vel) / 
                       (2.0f * state->max_accel);
    float decel_dist = (state->max_vel * state->max_vel) / 
                       (2.0f * state->max_decel);
    
    if (distance_abs >= (accel_dist + decel_dist)) {
        // We have space for full trapezoid: accelerate → cruise → decelerate
        desired_vel_profile = state->max_vel;
    } else {
        // Triangle profile: calculate optimal peak velocity
        // Solve: distance = v_peak²/(2a) + v_peak²/(2d)
        // v_peak = sqrt(2 * a * d * distance / (a + d))
        desired_vel_profile = sqrtf(
            (2.0f * state->max_accel * state->max_decel * distance_abs) /
            (state->max_accel + state->max_decel)
        );
    }
    
    // Apply direction
    desired_vel_profile *= (distance > 0) ? 1.0f : -1.0f;
    
    // 3. Calculate acceleration needed to reach desired velocity
    float vel_error = desired_vel_profile - state->current_vel;
    float required_accel = vel_error / dt;  // Acceleration to fix error in one step
    
    // 4. Limit acceleration to max values
    if (required_accel > state->max_accel) required_accel = state->max_accel;
    if (required_accel < -state->max_decel) required_accel = -state->max_decel;
    
    // 5. Update state
    state->current_vel += required_accel * dt;
    state->current_pos += state->current_vel * dt;
    
    // 6. Prevent overshoot
    if ((distance > 0 && state->current_pos > state->target_pos) ||
        (distance < 0 && state->current_pos < state->target_pos)) {
        state->current_pos = state->target_pos;
        state->current_vel = 0.0f;
    }
}