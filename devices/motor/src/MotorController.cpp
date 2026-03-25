#include "MotorController.h"
#include <Arduino.h>

using namespace canopener;

#define DOFFS_TARGET_POSITION 0x7a
#define DOFFS_POLARITY 0x7e
#define DOFFS_PROFILE_MAX_VELOCITY 0x81
#define DOFFS_PROFILE_MAX_ACCEL 0x83
#define DOFFS_PROFILE_MAX_DECEL 0x84
#define DOFFS_ACTUAL_POSITION 0x64
#define DOFFS_CONTROL 0x40

MotorController *instance=nullptr;

void IRAM_ATTR onTimer() {
    if (instance->targetSteps==instance->actualSteps) {
        digitalWrite(instance->pulPin, LOW);
        return;
    }

    instance->actualStepsMillis+=instance->actualStepsMillisPerTick;
    if (instance->actualStepsMillis<0) {
        instance->actualStepsMillis+=1000;
        instance->actualSteps--;
        digitalWrite(instance->dirPin, HIGH);
        digitalWrite(instance->pulPin, HIGH);
    }

    else if (instance->actualStepsMillis>1000) {
        instance->actualStepsMillis-=1000;
        instance->actualSteps++;
        digitalWrite(instance->dirPin, LOW);
        digitalWrite(instance->pulPin, HIGH);
    }

    else {
        digitalWrite(instance->pulPin, LOW);
    }
}

MotorController::MotorController(Device& dev)
		: device(dev), plannerTimer(5), debugTimer(250), idleTimer(1000) {
	pulPin=-1;
	dirPin=-1;

    baseIndex=0x0000;
    baseSubIndex=0x00;

    motion.current_pos=0;
    motion.current_vel=0;

    targetSteps=0;
    actualSteps=0;
    actualStepsMillis=0;
    actualStepsMillisPerTick=0;
}

void MotorController::begin() {
    instance=this;

    device.insert(baseIndex+DOFFS_TARGET_POSITION,baseSubIndex).setType(Entry::INT32).set<int32_t>(0);
	device.insert(baseIndex+DOFFS_PROFILE_MAX_VELOCITY,baseSubIndex).setType(Entry::INT32).set<int32_t>(1000);
	device.insert(baseIndex+DOFFS_PROFILE_MAX_ACCEL,baseSubIndex).setType(Entry::INT32).set<int32_t>(1000);
	device.insert(baseIndex+DOFFS_PROFILE_MAX_DECEL,baseSubIndex).setType(Entry::INT32).set<int32_t>(1000);
	device.insert(baseIndex+DOFFS_CONTROL,baseSubIndex).setType(Entry::UINT16).set<uint16_t>(0); // 0
	device.insert(baseIndex+DOFFS_POLARITY,baseSubIndex).setType(Entry::UINT8).set<uint8_t>(0);
	device.insert(baseIndex+DOFFS_ACTUAL_POSITION,baseSubIndex).setType(Entry::INT32);

    pinMode(pulPin,OUTPUT);
    pinMode(dirPin,OUTPUT);
    pinMode(enaPin,OUTPUT);
    digitalWrite(dirPin,LOW);
    digitalWrite(enaPin,HIGH);

    timer=timerBegin(0, 80, true); // 1 microsec per tick, 20000 Hz
    timerAttachInterrupt(timer,&onTimer,true);
    timerAlarmWrite(timer,50,true);
    timerAlarmEnable(timer);
}

int roundAwayFromZero(float x) {
    return (x > 0) ? ceil(x) : floor(x);
}

void MotorController::loop() {
	uint16_t control=device.at(baseIndex+DOFFS_CONTROL,baseSubIndex).get<uint16_t>();

    unsigned long deltaTime=plannerTimer.tick();
    if (deltaTime) {
	    motion.target_pos=device.at(baseIndex+DOFFS_TARGET_POSITION,baseSubIndex).get<int32_t>();
	    motion.max_vel=device.at(baseIndex+DOFFS_PROFILE_MAX_VELOCITY,baseSubIndex).get<int32_t>();
	    motion.max_accel=device.at(baseIndex+DOFFS_PROFILE_MAX_ACCEL,baseSubIndex).get<int32_t>();
	    motion.max_decel=device.at(baseIndex+DOFFS_PROFILE_MAX_DECEL,baseSubIndex).get<int32_t>();

	    update_trapezoidal_motion(&motion,deltaTime/1000.0);
	    device.at(baseIndex+DOFFS_ACTUAL_POSITION,baseSubIndex).set<int32_t>(motion.current_pos);

	    targetSteps=motion.current_pos;
        actualStepsMillisPerTick=roundAwayFromZero(motion.current_vel * (1000.0 / 20000));
        if (!actualStepsMillisPerTick)
            actualStepsMillisPerTick=((targetSteps>actualSteps)?1:-1);
    }

    if (targetSteps!=actualSteps)
        idleTimer.touch();

    if ((control&0x0f)==0x0f && idleTimer.active()) {
        digitalWrite(enaPin,LOW);
        if (debugTimer.tick()) {
            Serial.printf("motion tick, target=%d, actual=%d, fraq=%d, per=%d\n",targetSteps,actualSteps,actualStepsMillis,actualStepsMillisPerTick);
        }
    }

    else {
        digitalWrite(enaPin,HIGH);
        if (debugTimer.tick()) {
            Serial.printf("idle...\n");
        }
    }
}