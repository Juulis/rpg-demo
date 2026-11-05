"""Simulerar Rungläntans spawn (spawnzoner.json areas.startskogen) med kodens algoritm (SpawnSystem.roll).
Kör: python3 spel/design/verktyg/rung_sim.py [designmapp eller spawnzoner.json]. Skriver inget."""
import json,random,sys,os
sys.dont_write_bytecode=True
arg=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
if os.path.isdir(arg): arg=os.path.join(arg,'spawnzoner.json')
a=[x for x in json.load(open(arg))['areas'] if x['id']=='startskogen'][0]
R=a['session_roll']; pts=a['spawn_points']
def ri(r): return random.randint(r[0],r[1])
def sim():
    k=ri(R['active_spawn_points']); act=random.sample(pts,min(k,len(pts))); n=0; ch=0
    for p in act:
        t=p.get('enemy_table') or a['enemy_table']
        for _ in range(ri(p['groups'])):
            row=random.choices(t,weights=[x['weight'] for x in t])[0]
            c= ch<R['champions']['max'] and random.random()<R['champions']['chance_per_group']
            if c: ch+=1; n+=ri([2,3])
            else: n+=ri(row.get('group') or p.get('group_size') or R['monsters_per_group'])
    return n
random.seed(1); xs=sorted(sim() for _ in range(200000)); N=len(xs)
print(R['active_spawn_points'],'mean %.2f p5 %d p95 %d'%(sum(xs)/N,xs[int(.05*N)],xs[int(.95*N)]),'stated',R['expected_monsters_per_game'])
