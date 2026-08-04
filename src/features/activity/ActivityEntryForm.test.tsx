import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ActivityEntryForm } from './ActivityEntryForm';

describe('ActivityEntryForm', () => {
  it('starts every field at 0 when there is no existing entry', () => {
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Steps')).toHaveValue(0);
    expect(screen.getByLabelText('Sleep (hours)')).toHaveValue(0);
    expect(screen.getByLabelText('Exercise (minutes)')).toHaveValue(0);
  });

  it('pre-fills fields from an existing entry', () => {
    render(
      <ActivityEntryForm
        initialValues={{ steps: 8000, sleepHours: 7.5, exerciseMinutes: 20 }}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Steps')).toHaveValue(8000);
    expect(screen.getByLabelText('Sleep (hours)')).toHaveValue(7.5);
    expect(screen.getByLabelText('Exercise (minutes)')).toHaveValue(20);
  });

  it('labels the submit button as logging for a fresh day and updating for an already-logged one', () => {
    const { rerender } = render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: "Log today's activity" })).toBeInTheDocument();

    rerender(
      <ActivityEntryForm
        initialValues={{ steps: 1, sleepHours: 1, exerciseMinutes: 1 }}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: "Update today's activity" })).toBeInTheDocument();
  });

  it('calls onSubmit with the entered values', () => {
    const onSubmit = vi.fn();
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: '9000' } });
    fireEvent.change(screen.getByLabelText('Sleep (hours)'), { target: { value: '7.5' } });
    fireEvent.change(screen.getByLabelText('Exercise (minutes)'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).toHaveBeenCalledWith({ steps: 9000, sleepHours: 7.5, exerciseMinutes: 25 });
  });

  it('rejects steps above the sane upper bound without calling onSubmit', () => {
    const onSubmit = vi.fn();
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: '500000' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('activity-entry-validation-error')).toHaveTextContent(/Steps/);
  });

  it('rejects sleep hours above the sane upper bound without calling onSubmit', () => {
    const onSubmit = vi.fn();
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Sleep (hours)'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('activity-entry-validation-error')).toHaveTextContent(/Sleep hours/);
  });

  it('rejects exercise minutes above the sane upper bound without calling onSubmit', () => {
    const onSubmit = vi.fn();
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText('Exercise (minutes)'), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId('activity-entry-validation-error')).toHaveTextContent(
      /Exercise minutes/,
    );
  });

  it('treats a non-numeric or negative typed value as 0 rather than crashing', () => {
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={null}
        lastResult={null}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: '-50' } });
    expect(screen.getByLabelText('Steps')).toHaveValue(0);
  });

  it('disables the submit button while submitting', () => {
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={true}
        submitError={null}
        lastResult={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  });

  it('shows a submit error', () => {
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={new Error('network down')}
        lastResult={null}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('activity-entry-submit-error')).toBeInTheDocument();
  });

  it('shows the resulting Fitness/Sleep values after a successful submit', () => {
    render(
      <ActivityEntryForm
        initialValues={null}
        submitting={false}
        submitError={null}
        lastResult={{
          entry: {
            id: '2026-08-04',
            date: '2026-08-04',
            steps: 9000,
            sleepHours: 7.5,
            exerciseMinutes: 25,
            fitnessDelta: 18,
            sleepDelta: 15,
            loggedAt: '2026-08-04T09:00:00.000Z',
          },
          fitnessValue: 43,
          sleepValue: 30,
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('activity-entry-success')).toHaveTextContent(
      'Saved — Fitness 43, Sleep 30.',
    );
  });
});
