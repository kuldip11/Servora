import { describe, expect, it } from 'vitest';
import * as mod from '../recipes.service';

describe('recipes service',()=>{
  it('exposes the documented module boundary',()=>{
    const values=Object.entries(mod).filter(([k])=>k !== 'default');
    expect(values.length).toBeGreaterThan(0);
    const primary=values.find(([,v])=>v && typeof v==='object');
    expect(primary).toBeTruthy();
    expect(Object.keys(primary![1] as object).length).toBeGreaterThan(0);
  });
});
