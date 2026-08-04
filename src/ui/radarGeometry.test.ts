import { buildRadarLayout } from './radarGeometry';

const FIVE_AXES = [
  { key: 'health', label: 'Health', value: 72 },
  { key: 'career', label: 'Career', value: 55 },
  { key: 'relationships', label: 'Relationships', value: 40 },
  { key: 'finance', label: 'Finance', value: 30 },
  { key: 'growth', label: 'Growth', value: 60 },
];

describe('buildRadarLayout', () => {
  it('returns null below 3 axes', () => {
    expect(buildRadarLayout([], 100, 200)).toBeNull();
    expect(buildRadarLayout([{ key: 'a', label: 'A', value: 1 }], 100, 200)).toBeNull();
    expect(
      buildRadarLayout(
        [
          { key: 'a', label: 'A', value: 1 },
          { key: 'b', label: 'B', value: 1 },
        ],
        100,
        200,
      ),
    ).toBeNull();
  });

  it('produces exactly one axis layout entry per input axis, in order', () => {
    const layout = buildRadarLayout(FIVE_AXES, 100, 200)!;

    expect(layout.axes).toHaveLength(5);
    expect(layout.axes.map((a) => a.key)).toEqual([
      'health',
      'career',
      'relationships',
      'finance',
      'growth',
    ]);
    expect(layout.axes.map((a) => a.label)).toEqual([
      'Health',
      'Career',
      'Relationships',
      'Finance',
      'Growth',
    ]);
  });

  it('places the first axis straight up from center', () => {
    const layout = buildRadarLayout(FIVE_AXES, 100, 200)!;
    const first = layout.axes[0];

    expect(first.outer.x).toBeCloseTo(layout.center.x);
    expect(first.outer.y).toBeCloseTo(layout.center.y - layout.radius);
  });

  it('adapts to 4 axes (e.g. a domain-detail chart) with points 90 degrees apart', () => {
    const fourAxes = [
      { key: 'fitness', label: 'Fitness', value: 65 },
      { key: 'nutrition', label: 'Nutrition', value: 45 },
      { key: 'sleep', label: 'Sleep', value: 55 },
      { key: 'mental', label: 'Mental wellbeing', value: 50 },
    ];
    const layout = buildRadarLayout(fourAxes, 100, 200)!;

    expect(layout.axes).toHaveLength(4);
    // second axis (90deg clockwise from top) should sit directly right of center
    expect(layout.axes[1].outer.y).toBeCloseTo(layout.center.y);
    expect(layout.axes[1].outer.x).toBeGreaterThan(layout.center.x);
  });

  it('places a value at maxValue exactly on the outer edge', () => {
    const layout = buildRadarLayout(
      [
        { key: 'a', label: 'A', value: 100 },
        { key: 'b', label: 'B', value: 0 },
        { key: 'c', label: 'C', value: 0 },
      ],
      100,
      200,
    )!;

    expect(layout.axes[0].data.x).toBeCloseTo(layout.axes[0].outer.x);
    expect(layout.axes[0].data.y).toBeCloseTo(layout.axes[0].outer.y);
  });

  it('places a value of 0 exactly at the center', () => {
    const layout = buildRadarLayout(
      [
        { key: 'a', label: 'A', value: 0 },
        { key: 'b', label: 'B', value: 0 },
        { key: 'c', label: 'C', value: 0 },
      ],
      100,
      200,
    )!;

    expect(layout.axes[0].data.x).toBeCloseTo(layout.center.x);
    expect(layout.axes[0].data.y).toBeCloseTo(layout.center.y);
  });

  it('clamps a value above maxValue to the outer edge rather than overshooting', () => {
    const layout = buildRadarLayout(
      [
        { key: 'a', label: 'A', value: 999 },
        { key: 'b', label: 'B', value: 0 },
        { key: 'c', label: 'C', value: 0 },
      ],
      100,
      200,
    )!;

    expect(layout.axes[0].data.x).toBeCloseTo(layout.axes[0].outer.x);
    expect(layout.axes[0].data.y).toBeCloseTo(layout.axes[0].outer.y);
  });

  it('clamps a negative value to the center rather than going negative', () => {
    const layout = buildRadarLayout(
      [
        { key: 'a', label: 'A', value: -50 },
        { key: 'b', label: 'B', value: 0 },
        { key: 'c', label: 'C', value: 0 },
      ],
      100,
      200,
    )!;

    expect(layout.axes[0].data.x).toBeCloseTo(layout.center.x);
    expect(layout.axes[0].data.y).toBeCloseTo(layout.center.y);
  });

  it('handles a maxValue of 0 without dividing by zero', () => {
    const layout = buildRadarLayout(
      [
        { key: 'a', label: 'A', value: 0 },
        { key: 'b', label: 'B', value: 0 },
        { key: 'c', label: 'C', value: 0 },
      ],
      0,
      200,
    )!;

    expect(Number.isFinite(layout.axes[0].data.x)).toBe(true);
    expect(Number.isFinite(layout.axes[0].data.y)).toBe(true);
  });

  it('assigns a start/middle/end label anchor based on horizontal position', () => {
    const layout = buildRadarLayout(FIVE_AXES, 100, 200)!;
    const anchors = layout.axes.map((a) => a.labelAnchor);

    expect(anchors).toContain('start');
    expect(anchors).toContain('end');
    expect(anchors[0]).toBe('middle'); // top axis sits dead-center horizontally
  });

  describe('label margin (regression: Career/Growth were clipped by the SVG edge)', () => {
    // Conservative estimate of rendered text width at fontSize 11 — real glyphs are
    // narrower, so if a label fits under this estimate it fits in practice too.
    const PX_PER_CHAR = 7;

    function textExtent(label: string): number {
      return label.length * PX_PER_CHAR;
    }

    it('reserves a canvas bigger than the plotted chart', () => {
      const layout = buildRadarLayout(FIVE_AXES, 100, 220)!;
      expect(layout.canvasSize).toBeGreaterThan(220);
    });

    it('keeps every label fully inside the canvas at the widest axes (Career, Growth)', () => {
      for (const chartSize of [160, 220, 300]) {
        const layout = buildRadarLayout(FIVE_AXES, 100, chartSize)!;

        for (const axis of layout.axes) {
          const extent = textExtent(axis.label);
          if (axis.labelAnchor === 'start') {
            expect(axis.labelPoint.x + extent).toBeLessThanOrEqual(layout.canvasSize);
          } else if (axis.labelAnchor === 'end') {
            expect(axis.labelPoint.x - extent).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    it('keeps the longest label (Relationships) inside the canvas too', () => {
      const layout = buildRadarLayout(FIVE_AXES, 100, 220)!;
      const relationships = layout.axes.find((a) => a.key === 'relationships')!;

      expect(relationships.labelAnchor).toBe('start');
      expect(relationships.labelPoint.x + textExtent(relationships.label)).toBeLessThanOrEqual(
        layout.canvasSize,
      );
    });
  });
});
