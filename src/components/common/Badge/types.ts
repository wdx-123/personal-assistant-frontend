/**
 * Badge 标签组件类型定义
 */

export type BadgeTone = 'primary' | 'success' | 'danger' | 'neutral' | 'warning'
export type BadgeVariant = 'soft' | 'solid' | 'outline'
export type BadgeSize = 'xsmall' | 'small' | 'medium'

export interface BadgeProps {
  /** 色彩语义 */
  tone?: BadgeTone
  /** 视觉风格 */
  variant?: BadgeVariant
  /** 尺寸 */
  size?: BadgeSize
  /** 是否显示圆点 */
  showDot?: boolean
  /** 圆点是否脉冲 */
  dotPulse?: boolean
}
