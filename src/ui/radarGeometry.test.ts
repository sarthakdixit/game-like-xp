import { describe, expect, it } from 'vitest';

import { computeRadarGeometry, type RadarAxis } from './radarGeometry';

function axis(key: string, value: number): RadarAxis {
  return { key, label: key, value };
}

function expectPointClose(point: { x: number; y: number }, x: number, y: number, precision = 1) {
  expect(point.x).toBeCloseTo(x, precision);
  expect(point.y).toBeCloseTo(y, precision);
}

describe('computeRadarGeometry', () => {
  it('throws for fewer than 3 axes', () => {
    expect(() => computeRadarGeometry({ axes: [axis('a', 50), axis('b', 50)] })).toThrow();
  });

  it('does not throw for exactly 3 axes', () => {
    expect(() =>
      computeRadarGeometry({ axes: [axis('a', 50), axis('b', 50), axis('c', 50)] }),
    ).not.toThrow();
  });

  it('produces one spoke, one data point, and one label per axis', () => {
    const axes = [axis('a', 10), axis('b', 20), axis('c', 30), axis('d', 40), axis('e', 50)];

    const geometry = computeRadarGeometry({ axes });

    expect(geometry.spokes).toHaveLength(5);
    expect(geometry.dataPolygon).toHaveLength(5);
    expect(geometry.labels).toHaveLength(5);
  });

  it('produces one grid polygon per configured ring, each with one point per axis', () => {
    const axes = [axis('a', 50), axis('b', 50), axis('c', 50), axis('d', 50)];

    const geometry = computeRadarGeometry({ axes, gridRings: [0.33, 0.66, 1] });

    expect(geometry.gridPolygons).toHaveLength(3);
    for (const ring of geometry.gridPolygons) {
      expect(ring).toHaveLength(4);
    }
  });

  it('matches the style guide reference chart exactly for 5 axes at full value', () => {
    // design/chronicle-ui-style-guide.html's Home radar: cx=100, cy=100, R=80,
    // outer ring points "100,20 176.09,75.28 147.02,164.72 52.98,164.72 23.91,75.28"
    const axes = [
      axis('health', 100),
      axis('career', 100),
      axis('relationships', 100),
      axis('finance', 100),
      axis('growth', 100),
    ];

    const geometry = computeRadarGeometry({ axes });

    expectPointClose(geometry.dataPolygon[0], 100, 20);
    expectPointClose(geometry.dataPolygon[1], 176.09, 75.28);
    expectPointClose(geometry.dataPolygon[2], 147.02, 164.72);
    expectPointClose(geometry.dataPolygon[3], 52.98, 164.72);
    expectPointClose(geometry.dataPolygon[4], 23.91, 75.28);
  });

  it('matches the style guide reference chart for the 50%-ratio inner grid ring', () => {
    // reference inner ring: "100,60 138.04,87.64 123.51,132.36 76.49,132.36 61.96,87.64"
    const axes = [axis('a', 0), axis('b', 0), axis('c', 0), axis('d', 0), axis('e', 0)];

    const geometry = computeRadarGeometry({ axes, gridRings: [0.5] });
    const [ring] = geometry.gridPolygons;

    expectPointClose(ring[0], 100, 60);
    expectPointClose(ring[1], 138.04, 87.64);
    expectPointClose(ring[2], 123.51, 132.36);
    expectPointClose(ring[3], 76.49, 132.36);
    expectPointClose(ring[4], 61.96, 87.64);
  });

  it('places the data polygon at the center when every value is 0', () => {
    const axes = [axis('a', 0), axis('b', 0), axis('c', 0), axis('d', 0)];

    const geometry = computeRadarGeometry({ axes, center: { x: 50, y: 50 } });

    for (const point of geometry.dataPolygon) {
      expectPointClose(point, 50, 50);
    }
  });

  it('clamps values above 100 to the outer radius', () => {
    const axes = [axis('a', 999), axis('b', 100), axis('c', 100)];

    const geometry = computeRadarGeometry({ axes, radius: 80 });

    // axis 'a' points straight up (angle -90deg): x === center.x, y === center.y - radius
    expectPointClose(geometry.dataPolygon[0], 100, 20);
  });

  it('clamps negative values to the center', () => {
    const axes = [axis('a', -50), axis('b', 50), axis('c', 50)];

    const geometry = computeRadarGeometry({ axes });

    expectPointClose(geometry.dataPolygon[0], 100, 100);
  });

  it('anchors the top axis label in the middle (5-axis chart)', () => {
    const axes = [axis('top', 50), axis('b', 50), axis('c', 50), axis('d', 50), axis('e', 50)];

    const geometry = computeRadarGeometry({ axes });

    expect(geometry.labels[0].anchor).toBe('middle');
  });

  it('anchors right-side labels at start and left-side labels at end (5-axis chart)', () => {
    // matches the style guide: Career/Relationships (right side) -> start, Finance/Growth (left side) -> end
    const axes = [
      axis('health', 50),
      axis('career', 50),
      axis('relationships', 50),
      axis('finance', 50),
      axis('growth', 50),
    ];

    const geometry = computeRadarGeometry({ axes });

    expect(geometry.labels[1].anchor).toBe('start'); // career
    expect(geometry.labels[2].anchor).toBe('start'); // relationships
    expect(geometry.labels[3].anchor).toBe('end'); // finance
    expect(geometry.labels[4].anchor).toBe('end'); // growth
  });

  it('anchors top and bottom labels in the middle on a 4-axis chart', () => {
    const axes = [axis('top', 50), axis('right', 50), axis('bottom', 50), axis('left', 50)];

    const geometry = computeRadarGeometry({ axes });

    expect(geometry.labels[0].anchor).toBe('middle'); // top
    expect(geometry.labels[1].anchor).toBe('start'); // right
    expect(geometry.labels[2].anchor).toBe('middle'); // bottom
    expect(geometry.labels[3].anchor).toBe('end'); // left
  });

  it('positions labels beyond the outer radius', () => {
    const axes = [axis('top', 50), axis('b', 50), axis('c', 50)];

    const geometry = computeRadarGeometry({ axes, center: { x: 0, y: 0 }, radius: 80 });

    // top axis label should be further from center (larger |y|) than the outer ring itself
    expect(Math.abs(geometry.labels[0].y)).toBeGreaterThan(80);
  });

  it('uses a custom center and radius when provided', () => {
    const axes = [axis('top', 100), axis('b', 100), axis('c', 100)];

    const geometry = computeRadarGeometry({ axes, center: { x: 10, y: 10 }, radius: 5 });

    expectPointClose(geometry.dataPolygon[0], 10, 5);
  });
});
