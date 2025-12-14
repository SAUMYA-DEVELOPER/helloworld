export const SHAPES = {
  GALAXY: i => ({ x: Math.cos(i)*40, y: Math.sin(i)*40, z: i }),
  FLOWER: i => ({ x: Math.sin(i)*30, y: Math.cos(i*3)*30, z: 0 }),
  PLANET: i => ({ x: Math.cos(i)*50, y: 0, z: Math.sin(i)*50 }),
  DNA: i => ({ x: Math.sin(i)*20, y: i, z: Math.cos(i)*20 }),
  HEART: i => ({
    x: 16*Math.pow(Math.sin(i),3),
    y: 13*Math.cos(i)-5*Math.cos(2*i),
    z: 0
  })
};
