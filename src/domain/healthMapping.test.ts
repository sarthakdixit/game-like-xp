import {
  fitnessDeltaFromExercise,
  fitnessDeltaFromSteps,
  mapHealthSampleToStatDeltas,
  sleepDeltaFromMinutes,
} from './healthMapping';

describe('fitnessDeltaFromSteps', () => {
  it('awards 0 for no steps', () => {
    expect(fitnessDeltaFromSteps(0)).toBe(0);
  });

  it('awards 0 just under the 2000-step tier', () => {
    expect(fitnessDeltaFromSteps(1999)).toBe(0);
  });

  it('awards 3 at exactly the 2000-step tier boundary', () => {
    expect(fitnessDeltaFromSteps(2000)).toBe(3);
  });

  it('awards 6 at exactly the 5000-step tier boundary', () => {
    expect(fitnessDeltaFromSteps(5000)).toBe(6);
  });

  it('awards 10 at exactly the 8000-step tier boundary', () => {
    expect(fitnessDeltaFromSteps(8000)).toBe(10);
  });

  it('awards 14 at exactly the 12000-step tier boundary', () => {
    expect(fitnessDeltaFromSteps(12000)).toBe(14);
  });

  it('awards 14 for a very high step count above the top tier', () => {
    expect(fitnessDeltaFromSteps(30000)).toBe(14);
  });
});

describe('fitnessDeltaFromExercise', () => {
  it('awards 0 for no exercise', () => {
    expect(fitnessDeltaFromExercise(0)).toBe(0);
  });

  it('awards 0 for under 10 minutes', () => {
    expect(fitnessDeltaFromExercise(9)).toBe(0);
  });

  it('awards 1 point per 10 minutes', () => {
    expect(fitnessDeltaFromExercise(10)).toBe(1);
    expect(fitnessDeltaFromExercise(35)).toBe(3);
  });

  it('caps at 10 regardless of how long the workout ran', () => {
    expect(fitnessDeltaFromExercise(200)).toBe(10);
  });
});

describe('sleepDeltaFromMinutes', () => {
  it('awards 0 for under 4 hours', () => {
    expect(sleepDeltaFromMinutes(0)).toBe(0);
    expect(sleepDeltaFromMinutes(239)).toBe(0);
  });

  it('awards 3 for the 4-6h tier', () => {
    expect(sleepDeltaFromMinutes(240)).toBe(3);
    expect(sleepDeltaFromMinutes(359)).toBe(3);
  });

  it('awards 7 for the 6-7h tier', () => {
    expect(sleepDeltaFromMinutes(360)).toBe(7);
    expect(sleepDeltaFromMinutes(419)).toBe(7);
  });

  it('awards the maximum 12 for the ideal 7-9h range', () => {
    expect(sleepDeltaFromMinutes(420)).toBe(12);
    expect(sleepDeltaFromMinutes(480)).toBe(12);
    expect(sleepDeltaFromMinutes(539)).toBe(12);
  });

  it('awards 7 for the 9-10h oversleep tier', () => {
    expect(sleepDeltaFromMinutes(540)).toBe(7);
    expect(sleepDeltaFromMinutes(599)).toBe(7);
  });

  it('awards 3 for 10h or more', () => {
    expect(sleepDeltaFromMinutes(600)).toBe(3);
    expect(sleepDeltaFromMinutes(1000)).toBe(3);
  });
});

describe('mapHealthSampleToStatDeltas', () => {
  it('maps an inactive rest day to zero deltas', () => {
    const deltas = mapHealthSampleToStatDeltas({ steps: 0, sleepMinutes: 0, exerciseMinutes: 0 });

    expect(deltas).toEqual({ fitnessDelta: 0, sleepDelta: 0 });
  });

  it('maps a solid day (steps + workout + ideal sleep) to combined deltas', () => {
    // fixture: 9,200 steps, 45-minute workout, 7.5h sleep
    const deltas = mapHealthSampleToStatDeltas({
      steps: 9200,
      sleepMinutes: 450,
      exerciseMinutes: 45,
    });

    expect(deltas).toEqual({ fitnessDelta: 10 + 4, sleepDelta: 12 });
  });

  it('maps a sedentary but well-rested day (steps only, no workout)', () => {
    // fixture: 3,000 steps, no exercise session logged, 8h sleep
    const deltas = mapHealthSampleToStatDeltas({
      steps: 3000,
      sleepMinutes: 480,
      exerciseMinutes: 0,
    });

    expect(deltas).toEqual({ fitnessDelta: 3, sleepDelta: 12 });
  });

  it('maps an extreme day (huge step count, long workout, oversleeping) with caps applied', () => {
    // fixture: marathon day — 40,000 steps, 3-hour tracked exercise session, 11h recovery sleep
    const deltas = mapHealthSampleToStatDeltas({
      steps: 40000,
      sleepMinutes: 660,
      exerciseMinutes: 180,
    });

    expect(deltas).toEqual({ fitnessDelta: 14 + 10, sleepDelta: 3 });
  });
});
