import { colors, spacing, radii, typography } from '../src/theme';

describe('Sovereign Legal Interface Theme Tokens', () => {
  it('strictly adheres to core brand colors from DESIGN.md', () => {
    expect(colors.background).toBe('#0B1020');
    expect(colors.surfaceContainer).toBe('#141A2E');
    expect(colors.surfaceContainerHigh).toBe('#1C233D');
    expect(colors.border).toBe('#253052');
    expect(colors.primary).toBe('#E0A93B');
    expect(colors.verified).toBe('#3FB68B');
    expect(colors.emergency).toBe('#E5484D');
    expect(colors.textPrimary).toBe('#FFFFFF');
    expect(colors.textSecondary).toBe('#A8B0C4');
    expect(colors.onPrimary).toBe('#0B1020');
  });

  it('maintains strict 4px/8px spacing rhythm', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
    expect(spacing.margin).toBe(16);
  });

  it('defines radii hierarchy from DESIGN.md', () => {
    expect(radii.sm).toBe(4);
    expect(radii.md).toBe(8);
    expect(radii.lg).toBe(16);
    expect(radii.full).toBe(9999);
  });

  it('configures typography hierarchy with 16px body baseline', () => {
    expect(typography.bodyLg.fontSize).toBe(16);
    expect(typography.headlineLg.fontSize).toBe(26);
    expect(typography.headlineMd.fontSize).toBe(22);
    expect(typography.headlineSm.fontSize).toBe(18);
  });
});
