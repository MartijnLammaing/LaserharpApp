
import * as SerialPort from 'serialport';
import { setTimeout } from 'timers';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import * as T from 'timbre';
import { EventEmitter } from 'events';

interface LaserData {
	beam: number;
	measure1: number;
	measure2: number;
}

const openSerialCommunication = () => () => {
	console.log('open serial communication');
}

const appendNewData = (combined: Uint8Array): Uint8Array => {
	const combinedString = combined.toString();
	const [ firstPart, secondPart ] = combinedString.split(String.fromCharCode(13));

	return secondPart ? new Buffer(secondPart) : combined;
}

const getLine = (combined = "") => {
	const [ firstPart, secondPart ] = combined.split(String.fromCharCode(13));

	return !secondPart ? secondPart : firstPart;
}

const parseNewLine = (newLine: string): LaserData => {
	const [ beam, measurement ] = newLine.split(':');
	const [ measure1, measure2 ] = measurement.split('-');

	return { beam: parseInt(beam), measure1: parseInt(measure1), measure2: parseInt(measure2) };
}

const parseNewInput = (emitter: EventEmitter) => (input: string) => {
	if(input.indexOf(':') > -1){
		emitter.emit(EVENTS.NEW_MEASUREMENT_RECEIVED, parseNewLine(input));
	}
}

const receiveData = (emitter: EventEmitter) => {
	let dataBuffer: Uint8Array = new Uint8Array();

	return (data: Uint8Array) => {

		const combined = Buffer.concat([dataBuffer, data]);
		const newLine = getLine(combined.toString());
		dataBuffer = appendNewData(combined);

		if(newLine !== undefined && newLine !== '') {
			parseNewInput(emitter)(newLine);
		}
	}
}

enum EVENTS {
	NEW_MEASUREMENT_RECEIVED = 'new:measurement:received'
}

const addNewMeasureToBeams = (beams: Beams) => {
	var VCO = [
		T("pluck", {freq:500, mul:1}).bang(),
		T("pluck", {freq:500, mul:1}).bang(),
		T("pluck", {freq:500, mul:1}).bang(),
		T("pluck", {freq:500, mul:1}).bang(),
		T("pluck", {freq:500, mul:1}).bang()
	];
	// var VCO   = T("sin", {freq: 440});

	return (laserData: LaserData) => {
		
		beams = addMeasure(beams, laserData.beam, laserData.measure1, laserData.measure2);
		
		updateSound(VCO, beams);
	}
} 

const frequency = {
	0: 0,
	1: 220,
	2: 250,
	3: 262,
	4: 294,
	5: 330,
	6: 350,
	7: 392,
	8: 440,
	9: 494,
	10: 523,
	11: 587,
	12: 659,
	13: 698,
	14: 784,
	15: 880
}

const updateSound = (sounds, beams: Beams) => {
	beams.beams.forEach((beam) => {
		
		const scale = getScaleNumber(beam.distance) * beam.angle;
		if(scale > 0){
			sounds[beam.angle-1].set({ freq: frequency[scale] });
		}
			
		
		if(soundTurnOn(beam)){
			sounds[beam.angle-1].bang().play();
		}
		// if(soundTurnOff(beam)){
		// 	console.log('off');
		// 	sounds.pause();
		// }
	})
}

export const init = () => {
const portName = '/dev/ttyACM0';
const serialPort = new SerialPort(portName, {
	baudRate: 9600,
});

const emitter = new EventEmitter();

let beams: Beams = createBeams([1,2,3,4,5]);

serialPort.on('open', openSerialCommunication());
serialPort.on('data', receiveData(emitter));

emitter.on(EVENTS.NEW_MEASUREMENT_RECEIVED, addNewMeasureToBeams(beams));
   }

const createBeams = (beamsArray: Array<number>) => ({ beams: beamsArray.map(beam => ({ angle: beam, direction: DIRECTION.NONE, distance: null as unknown as number, leftMeasures: [] as Array<number>, rightMeasures: [] as Array<number> })) });

export enum STATE {
	NONE = 'NONE',
	HOLD = 'HOLD',
	LEFT = 'LEFT',
	RIGHT = 'RIGHT'
}

export enum DIRECTION {
	NONE = 'NONE',
	LEFT_TO_RIGHT = 'LEFT_TO_RIGHT',
	RIGHT_TO_LEFT = 'RIGHT_TO_LEFT',
	HOLD = 'HOLD'
}

enum Colour { noBeam, redBeam, greenBeam, blueBeam, redGreenBeam,  redBlueBeam, greenBlueBeam, redGreenBlueBeam };

interface Beams {
	beams: Array<Beam>;
}

interface Beam {
	angle: number,
	direction: DIRECTION,
	distance: number,
	leftMeasures: Array<number>,
	rightMeasures: Array<number>
}

const addMeasure = (beams: Beams, index: number, leftMeasure: number, rightMeasure: number) => {
	if(index-1 <= beams.beams.length){
		const beam = beams.beams[index-1];
		beams.beams[index-1] = addMeasureToBeam(beam, leftMeasure, rightMeasure);
	}

	return beams;
}

const addMeasureToBeam = (beam: Beam, leftMeasure: number, rightMeasure: number): Beam => {

	const leftMeasures = [leftMeasure];
	const rightMeasures =[rightMeasure];

	const newBeam = {
		angle: beam.angle,
		distance: getDistanceFrom(leftMeasures, rightMeasures),
		direction: DIRECTION.NONE,//getDirectionFrom(leftMeasures, rightMeasures),
		leftMeasures,
		rightMeasures,
	};

	return newBeam;
}


const stateArrayToDirection = (stateArray: Array<STATE>): DIRECTION => {
	if(stateArray[0] === STATE.LEFT && stateArray[1] === STATE.HOLD && stateArray[2] === STATE.RIGHT){
		return DIRECTION.LEFT_TO_RIGHT;
	}

	if(stateArray[0] === STATE.RIGHT && stateArray[1] === STATE.HOLD && stateArray[2] === STATE.LEFT){
		return DIRECTION.RIGHT_TO_LEFT;
	}

	if(stateArray[0] === STATE.HOLD) {
		return DIRECTION.HOLD;
	}

	return DIRECTION.NONE;
}

const getDirectionFrom = (leftMeasures: Array<number>, rightMeasures: Array<number>): DIRECTION => {
	const sampleSize = 10;

	const stateArray = getStateArray(sampleSize, leftMeasures, rightMeasures);


	return stateArrayToDirection(stateArray);
}

const getStateArray = (numberOfSamples: number, leftMeasures: Array<number>, rightMeasures: Array<number>): Array<STATE> => {
	const stateArray = [...Array(numberOfSamples)].map((number, index) => getStateInPast(index, leftMeasures, rightMeasures));
	return [...new Set([...stateArray.filter(s => s !== STATE.NONE)])];
}

const getStateInPast = (index: number, leftMeasures: Array<number>, rightMeasures: Array<number>): STATE => {
	const leftDistance = getAveragedDistance(leftMeasures.slice(0, leftMeasures.length - index - 1));
	const rightDistance = getAveragedDistance(rightMeasures.slice(0, leftMeasures.length - index - 1));

	const leftValid = isValidValue(leftDistance);
	const rightValid = isValidValue(rightDistance);

	
	if(leftValid && rightValid){
		return STATE.HOLD;
	}

	if(leftValid){
		return STATE.LEFT;
	}

	if(rightValid){
		return STATE.RIGHT;
	}

	return STATE.NONE;
}

const getDistanceFrom = (leftMeasures: Array<number>, rightMeasures: Array<number>): number => {
	const range = 1;

	const leftDistance = getAveragedDistance(leftMeasures);
	const rightDistance = getAveragedDistance(rightMeasures);

	if(leftDistance === undefined || leftDistance === null || rightDistance === undefined || rightDistance === null){
		return 0;
	}

	if(isWithinRange(leftDistance, rightDistance, range)){
		return (leftDistance + rightDistance) / 2;
	}

	return 0;
}


const getAveragedDistance = (measureList: Array<number>): number => {
	const measures = [...measureList];
	const maxSampleSize = 1;
	const range = 75;

	const sample = measures.reverse().slice(0, maxSampleSize);

	const streak = sample.reduce((acc, value, index) => { 
		if(isWithinRange((acc.length > 0 ? acc : [value])[0], value, range) && index === acc.length){
			return acc.concat([value]);
		}

		return acc;
	}, [] as number[]);

	return streak.reduce((acc, value) => {
		return acc + value;
	}, 0) / streak.length;
}

const lowerLimit = 25;
const upperLimit = 500;
const numberOfScales = 3

const getScaleNumber = (distance: number) => {
	const scaleSize = (upperLimit - lowerLimit) / numberOfScales;
	return Math.ceil((distance - lowerLimit) / scaleSize);
}

const isValidValue = (value: number) => {
	return value > lowerLimit && value < upperLimit;
}

const isWithinRange = (val1: number, val2: number, range: number) => {
	if(!isValidValue(val1) || !isValidValue(val2)){
		return false;
	}

	return Math.abs(val1 - val2) / ((val1 + val2)/2) <= range;
}

const soundBeams = ({ beams }: Beams) => {
	//beams.map((beam, index) => { soundBeam(beam)});
}



const soundTurnOn = (beam: Beam) => isValidValue(beam.distance);

const soundTurnOff = (beam: Beam) => !isValidValue(beam.distance);

const printBeams = ({ beams }: Beams) => {
	return beams.map(beam => beam.distance).join('-');
}