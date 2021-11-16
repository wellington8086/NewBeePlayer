declare module 'spring-animator' {
  export type Spring = {
    setDestination: (val: number) => void
    tick: (stiffness?: number, dampening?: number) => void
    getCurrentValue: () => number
  }
  export function createSpring(stiffness: number, dampening: number, startingValue: number): Spring;
}
