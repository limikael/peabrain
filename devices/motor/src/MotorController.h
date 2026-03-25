#pragma once
#include "trapezoidal_motion.h"
#include "canopener.h"
#include "SoftTimer.h"
#include "IdleTimer.h"

class MotorController {
public:
	MotorController(canopener::Device& device);
	void begin();
	void setPulPin(int pulPin_) { pulPin=pulPin_; }
	void setDirPin(int dirPin_) { dirPin=dirPin_; }
	void setEnaPin(int enaPin_) { enaPin=enaPin_; }
	void setBaseIndex(uint16_t baseIndex_) { baseIndex=baseIndex_; }
	void setBaseSubIndex(uint8_t baseSubIndex_) { baseSubIndex=baseSubIndex_; }
	void loop();

private:
	volatile int32_t targetSteps,actualSteps;
	//volatile int32_t timerRunsPerStep=0, timerRunCounter=0;
	//unsigned long previousMillis;
	volatile int32_t actualStepsMillis, actualStepsMillisPerTick;
	volatile int pulPin,dirPin,enaPin;
	//volatile bool activeStep;
	trapezoidal_motion_t motion;
	canopener::Device& device;
	uint16_t baseIndex;
	uint8_t baseSubIndex;
	SoftTimer plannerTimer,debugTimer;
	IdleTimer idleTimer;
	hw_timer_t *timer=nullptr;

	friend void IRAM_ATTR onTimer();
};
