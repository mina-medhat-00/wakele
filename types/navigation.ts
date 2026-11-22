/** Props of tab icon components. */
export interface TabBarIconProps {
  focused: boolean;
  color: string;
  size: number;
}

/**
 * What React Navigation passes to `tabBarIcon`. `color` is a platform color value
 * typed loosely so the renderer accepts every form the navigator may pass
 */
export interface TabBarIconRenderProps {
  focused: boolean;
  color: unknown;
  size: number;
}
