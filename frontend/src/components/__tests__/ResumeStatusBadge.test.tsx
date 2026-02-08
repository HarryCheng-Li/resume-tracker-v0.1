import { render, screen } from '@testing-library/react';
import ResumeStatusBadge from '../ResumeStatusBadge';
import { ResumeStatus } from '../../types';

describe('ResumeStatusBadge', () => {
  it('renders base status label', () => {
    render(<ResumeStatusBadge status={ResumeStatus.WAIT_IDENTIFY} />);

    expect(screen.getByText('待识别')).toBeInTheDocument();
  });

  it('renders near-sla badge when near and not overdue', () => {
    render(<ResumeStatusBadge status={ResumeStatus.WAIT_IDENTIFY} isNearSla />);

    expect(screen.getByText('⚠️ 即将超期')).toBeInTheDocument();
  });

  it('renders overdue days badge only when overdueDays >= 1', () => {
    const { rerender } = render(
      <ResumeStatusBadge status={ResumeStatus.WAIT_IDENTIFY} isOverdue overdueDays={1} />
    );

    expect(screen.getByText('🚨 已超期1天')).toBeInTheDocument();

    rerender(<ResumeStatusBadge status={ResumeStatus.WAIT_IDENTIFY} isOverdue overdueDays={0} />);
    expect(screen.queryByText(/已超期/)).not.toBeInTheDocument();
  });
});
