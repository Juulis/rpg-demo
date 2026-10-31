"""XP-takt i akt 1 delområde för delområde (bana1_stor.json nivakurva).
Användning: python3 spel/design/verktyg/akt1.py [designmapp]
Läser delomraden (enemy_table och monster_per_game; enemy_table som sträng pekar på spawnzoner.json areas.<id>),
ring_2_kontroll för ring 2, bossar ur fältet boss i delomraden och ring_2_kontroll och xp_penalty som i monster_niva.json.
Skriver ut två vägar: hela akt 1 (ring 0 till 2 inklusive Myrkanten och Brandkanten) och kortaste_vag."""
import sys; sys.dont_write_bytecode = True
import json,os,sys
d=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
L=lambda f:json.load(open(os.path.join(d,f),encoding='utf-8'))
m=L('monsterfamiljer.json');mn=L('monster_niva.json');b=L('bana1_stor.json');s=L('spawnzoner.json');w=L('varld_stor.json')
SA={a['id']:a for a in s['areas']}; M={x['id']:x for x in m['monsters']}
curve=[(l['level'],l['xp_total_at_level']) for l in mn['hero_xp_curve']['levels']]
def lvl(xp): return max(l for l,t in curve if t<=xp)
def mult(diff,boss=False):
    v=min(1.25,1+0.05*-diff) if diff<0 else (1.0 if diff<=3 else {4:.9,5:.75,6:.55,7:.35,8:.2,9:.1}.get(diff,.05))
    return max(.25,v) if boss else v
def area_table(t):
    if isinstance(t,str): t=SA[t.split('areas.')[1].split()[0]]['enemy_table']
    return [(e['enemy'],e['weight']) for e in t]
tab={x['id']:(area_table(x['enemy_table']),x['monster_per_game'],x['region']) for x in b['delomraden']}
for k in b['nivakurva']['ring_2_kontroll']:
    t=k['tabell']
    t=area_table(t) if t.startswith('spawnzoner') else [(p.split()[0],float(p.split()[1])) for p in t.split(',')]
    tab[k['region']]=(t,k['monster_per_game'],k['region'])
boss={x['id']:x['boss'] for x in b['delomraden'] if x.get('boss')}
boss.update({k['region']:k['boss'] for k in b['nivakurva']['ring_2_kontroll'] if k.get('boss')})
def run(path,xp=0):
    out=[]
    for a in path:
        t,n,_=tab[a]; W=sum(x[1] for x in t); g=0
        for e,wt in t:
            mo=M[e]; g+=n*wt/W*mo['xp']*mult(lvl(xp)-mo['level'])
        if a in boss: mo=M[boss[a]]; g+=mo['xp']*mult(lvl(xp)-mo['level'],True)
        xp+=g; out.append((a,round(g),round(xp),lvl(xp)))
    return out
ring01=['runglantan','dimgranarna','backravinen','kolarkojorna','milorna','brunna_garden','vargaby_utmark','vargaby_delomrade','idets_skog','norra_hygget']
full=ring01+['gravasen','gamla_byn','myrkanten','brandkanten','kapellets_krypta']
for namn,p in (('hela akt 1',full),('kortaste vägen',b['nivakurva']['kortaste_vag']['vag'])):
    print(namn)
    for r in run(p): print(f'  {r[0]:<20} XP {r[1]:>6}  kumulativ {r[2]:>6}  nivå {r[3]}')
