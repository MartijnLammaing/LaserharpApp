#include "VL53L0X.h"
#include "Wire.h"
#include <i2cdetect.h>

VL53L0X sensor1a;
VL53L0X sensor1b;
VL53L0X sensor2a;
VL53L0X sensor2b;
VL53L0X sensor3a;
VL53L0X sensor3b;
VL53L0X sensor4a;
VL53L0X sensor4b;
VL53L0X sensor5a;
VL53L0X sensor5b;

const int xshut1a = 13;
const int xshut1b = 12;
const int xshut2a = 11;
const int xshut2b = 10;
const int xshut3a = 9;
const int xshut3b = 8;
const int xshut4a = 7;
const int xshut4b = 6;
const int xshut5a = 5;
const int xshut5b = 4;

void setup() {
  pinMode(xshut1a,OUTPUT);
  pinMode(xshut1b,OUTPUT);
  pinMode(xshut2a,OUTPUT);
  pinMode(xshut2b,OUTPUT);
  pinMode(xshut3a,OUTPUT);
  pinMode(xshut3b,OUTPUT);
  pinMode(xshut4a,OUTPUT);
  pinMode(xshut4b,OUTPUT);
  pinMode(xshut5a,OUTPUT);
  pinMode(xshut5b,OUTPUT);

  digitalWrite(xshut1a, LOW);
  digitalWrite(xshut1b, LOW);
  digitalWrite(xshut2a, LOW);
  digitalWrite(xshut2b, LOW);
  digitalWrite(xshut3a, LOW);
  digitalWrite(xshut3b, LOW);
  digitalWrite(xshut4a, LOW);
  digitalWrite(xshut4b, LOW);
  digitalWrite(xshut5a, LOW);
  digitalWrite(xshut5b, LOW);

  Serial.begin(9600);
  Wire.begin();

  Serial.println("VL53L0X Boot up");
  while (! Serial) {
    delay(1);
  }
  Serial.println("Serial booted up");
  delay(100);

  digitalWrite(xshut1a,HIGH);
  sensor1a.init();
  sensor1a.setAddress(0x20);
  sensor1a.setMeasurementTimingBudget(20000);
  sensor1a.startContinuous();

  digitalWrite(xshut1b,HIGH);
  sensor1b.init();
  sensor1b.setAddress(0x21);
  sensor1b.setMeasurementTimingBudget(20000);
  sensor1b.startContinuous();

  digitalWrite(xshut2a, HIGH);
  sensor2a.init();
  sensor2a.setAddress(0x22);
  sensor2a.setMeasurementTimingBudget(20000);
  sensor2a.startContinuous();

  digitalWrite(xshut2b, HIGH);
  sensor2b.init();
  sensor2b.setAddress(0x23);
  sensor2b.setMeasurementTimingBudget(20000);
  sensor2b.startContinuous();
  digitalWrite(xshut3a,HIGH);
  sensor3a.init();
  sensor3a.setAddress(0x24);
  sensor3a.setMeasurementTimingBudget(20000);
  sensor3a.startContinuous();
  digitalWrite(xshut3b,HIGH);
  sensor3b.init();
  sensor3b.setAddress(0x25);
  sensor3b.setMeasurementTimingBudget(20000);
  sensor3b.startContinuous();

  digitalWrite(xshut4a, HIGH);
  sensor4a.init();
  sensor4a.setAddress(0x26);
  sensor4a.setMeasurementTimingBudget(20000);
  sensor4a.startContinuous();
  digitalWrite(xshut4b, HIGH);
  sensor4b.init();
  sensor4b.setAddress(0x27);
  sensor4b.setMeasurementTimingBudget(20000);
  sensor4b.startContinuous();

  digitalWrite(xshut5a,HIGH);
  sensor5a.init();
  sensor5a.setAddress(0x28);
  sensor5a.setMeasurementTimingBudget(20000);
  sensor5a.startContinuous();
  digitalWrite(xshut5b,HIGH);
  sensor5b.init();
  sensor5b.setAddress(0x29);
  sensor5b.setMeasurementTimingBudget(20000);
  sensor5b.startContinuous();

}

void loop() {
  reportDistance(1, sensor1a, sensor1b);
  reportDistance(2, sensor2a, sensor2b);
  reportDistance(3, sensor3a, sensor3b);
  reportDistance(4, sensor4a, sensor4b);
  reportDistance(5, sensor5a, sensor5b);
}

void reportDistance(int currentBeam,VL53L0X sensorA,VL53L0X sensorB){
      int distance1 = sensorA.readRangeContinuousMillimeters();
      int distance2 = sensorB.readRangeContinuousMillimeters();

      if(distance1 < 8000 || distance2 < 8000){
        Serial.print(currentBeam);
        Serial.print(':');
        Serial.print(sensorA.readRangeContinuousMillimeters());
        Serial.print('-');
        Serial.println(sensorB.readRangeContinuousMillimeters());
      }
}
