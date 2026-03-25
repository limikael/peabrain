# Peabrain

**A modern, open system for building machines — like you build software.**

---

## Why Peabrain?

Building physical machines is still stuck in the past.

- Expensive, centralized PLC systems  
- Slow iteration cycles  
- Specialized languages (IEC 61131-3)  
- Hard to test, simulate, and collaborate  

Meanwhile, software teams ship daily using modern tools.

**Peabrain brings that workflow to machine control.**

---

## What is Peabrain?

Peabrain is an open, bus-centric machine control system that combines:

- ⚡ Low-cost distributed hardware (ESP32-based nodes)
- 🔌 CAN bus architecture for modular systems
- 🧠 A JavaScript/TypeScript runtime for control logic
- 🛠️ A modern developer workflow (npm-style, deploy, test, iterate)

Instead of programming a monolithic PLC, you build systems out of small nodes and control them with high-level code.

---

## Core Idea

> Machines should be built like software systems.

That means:

- Modular components  
- Declarative logic  
- Fast iteration  
- Version control  
- Simulation and testing  

---

## Architecture Overview

### Hardware

- Small, dedicated nodes (GPIO, motor control, etc.)
- Connected via CAN bus
- Based on affordable microcontrollers (ESP32-C3)

### Software Stack

**Low-level (C++)**
- Lightweight CANopen-style stack ("canopener")

**Binding Layer**
- Auto-generated bindings between C++ and JavaScript

**High-level (JavaScript/TypeScript)**
- Runs on a central Logic & Interface Unit (LIU)
- React-like patterns with hooks
- Device abstraction via profiles (e.g. `MotorDevice`, `GpioDevice`)

---

## Example

Instead of dealing with registers and object dictionaries:

```js
motor.targetPosition = 1000;
await motor.waitUntilReached();
