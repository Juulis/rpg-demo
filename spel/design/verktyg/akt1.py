"""XP-takt i akt 1 delområde för delområde (bana1_stor.json nivakurva).
Användning: python3 spel/design/verktyg/akt1.py [designmapp]
Läser delomraden (enemy_table och monster_per_game; enemy_table som sträng pekar på spawnzoner.json areas.<id>),
ring_2_kontroll för ring 2, bossar ur fältet boss i delomraden och ring_2_kontroll och spelets XP-formel (spelregler.Xp, ett kill i taget, boss_xp_faktor tillämpas här).
Skriver ut två vägar: hela akt 1 (ring 0 till 2 inklusive Myrkanten och Brandkanten) och kortaste_vag."""
import sys; sys.dont_write_bytecode = True
import json,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from spelregler import Xp
d=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
L=lambda f:json.load(open(os.path.join(d,f),encoding='utf-8'))
m=L('monsterfamiljer.json');mn=L('monster_niva.json');b=L('bana1_stor.json');s=L('spawnzoner.json');w=L('varld_stor.json')
SA={a['id']:a for a in s['areas']}; M={x['id']:x for x in m['monsters']}
X=Xp(d)
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
        t,n,_=tab[a]; W=sum(x[1] for x in t); x0=xp
        xp=X.gain(xp,n,[(e,wt/W) for e,wt in t])
        if a in boss: xp=X.gain(xp,1,[(boss[a],1.0)])
        out.append((a,round(xp-x0),round(xp),X.lvl(xp)))
    return out
ring01=['runglantan','dimgranarna','backravinen','kolarkojorna','milorna','brunna_garden','vargaby_utmark','vargaby_delomrade','idets_skog','norra_hygget']
full=ring01+['gravasen','gamla_byn','myrkanten','brandkanten','kapellets_krypta']
for namn,p in (('hela akt 1',full),('kortaste vägen',b['nivakurva']['kortaste_vag']['vag'])):
    print(namn)
    for r in run(p): print(f'  {r[0]:<20} XP {r[1]:>6}  kumulativ {r[2]:>6}  nivå {r[3]}')
