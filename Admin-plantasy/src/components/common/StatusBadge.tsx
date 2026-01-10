import React from 'react';
import { OrderStatus, PaymentStatus, ReviewStatus, TicketStatus } from '../../types';

export type BadgeVariant =
  | OrderStatus
  | PaymentStatus
  | ReviewStatus
  | TicketStatus
  | "active"
  | "inactive";

interface StatusBadgeProps {
  status: BadgeVariant;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusClass = (): string => {
    switch (status) {
      case 'pending':
        return 'admin-badge-pending';
      case 'confirmed':
      case 'paid':
      case 'approved':
      case 'active':
      case 'in_progress':
        return 'admin-badge-confirmed';
      case 'shipped':
        return 'admin-badge-shipped';
      case 'delivered':
      case 'closed':
        return 'admin-badge-delivered';
      case 'cancelled':
      case 'failed':
      case 'rejected':
      case 'inactive':
        return 'admin-badge-cancelled';
      case 'refunded':
      case 'open':
        return 'admin-badge-pending';
      default:
        return 'admin-badge';
    }
  };

  const formatStatus = (s?: string): string => {
  if (!s) return 'Unknown';
  return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


  return (
    <span className={`${getStatusClass()} ${className}`}>
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
