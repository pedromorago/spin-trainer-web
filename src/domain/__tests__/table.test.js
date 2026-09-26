import { describe, expect, it } from 'vitest';
import { tableSeats } from '../table';

const sit = (format, hero, priorActions = []) => ({ format, hero, priorActions });
const brief = ({ seats }) => seats.map(s => [s.position, s.isHero ? 'hero' : s.folded ? 'fold' : s.action ?? '-', s.bet, s.isDealer ? 'D' : '']);

describe('tableSeats', () => {
  it('3-max, abre el BTN: ciegas puestas, BTN dealer, bote 1.5', () => {
    const t = tableSeats(sit('3max', 'BTN'), 25);
    expect(brief(t)).toEqual([['BTN', 'hero', 0, 'D'], ['SB', '-', 0.5, ''], ['BB', '-', 1, '']]);
    expect(t.pot).toBe(1.5);
  });

  it('BB vs BTN min-raise con SB fold: la ciega de la SB queda en el bote; orden horario desde el héroe', () => {
    const t = tableSeats(sit('3max', 'BB', [{ position: 'BTN', action: 'MIN_RAISE' }, { position: 'SB', action: 'FOLD' }]), 20);
    expect(brief(t)).toEqual([['BB', 'hero', 1, ''], ['BTN', 'MIN_RAISE', 2, 'D'], ['SB', 'fold', 0.5, '']]);
    expect(t.pot).toBe(3.5);
  });

  it('limp y call completan hasta lo que hay que pagar', () => {
    const t = tableSeats(sit('3max', 'BB', [{ position: 'BTN', action: 'LIMP' }, { position: 'SB', action: 'CALL' }]), 15);
    expect(t.seats.map(s => s.bet)).toEqual([1, 1, 1]);
    expect(t.pot).toBe(3);
  });

  it('call de un min-raise paga 2 BB', () => {
    const t = tableSeats(sit('3max', 'BB', [{ position: 'BTN', action: 'MIN_RAISE' }, { position: 'SB', action: 'CALL' }]), 25);
    expect(t.seats.find(s => s.position === 'SB').bet).toBe(2);
  });

  it('raise y 3-bet sin tamaño conocido: apuesta y bote null', () => {
    const t = tableSeats(sit('3max', 'BB', [{ position: 'BTN', action: 'MIN_RAISE' }, { position: 'SB', action: 'THREE_BET' }]), 12.5);
    expect(t.seats.find(s => s.position === 'SB').bet).toBeNull();
    expect(t.pot).toBeNull();
  });

  it('HU vs open-shove: la SB es el botón y va all-in por el stack', () => {
    const t = tableSeats(sit('hu', 'BB', [{ position: 'SB', action: 'SHOVE' }]), 10);
    expect(brief(t)).toEqual([['BB', 'hero', 1, ''], ['SB', 'SHOVE', 10, 'D']]);
    expect(t.pot).toBe(11);
  });

  it('rechaza formatos, héroes o acciones previas incoherentes', () => {
    expect(() => tableSeats(sit('6max', 'BTN'), 25)).toThrow('Formato');
    expect(() => tableSeats(sit('hu', 'BTN'), 25)).toThrow('Héroe');
    expect(() => tableSeats(sit('hu', 'BB', [{ position: 'BB', action: 'LIMP' }]), 25)).toThrow('Acción previa');
  });
});
