"""Täckning biom x ring för mellanmarken, plus kontroller av pooler, drop-tabeller, zones, grannar och lägrets NPC:er.
Användning: python3 spel/design/verktyg/tackning.py [designmapp]
Regel (varldsgenerator.json monsterpooler.tackning): en chunk spawnar en familj. Varje familj som har någon
undertyp i en cell (biom x ring) ska ha minst 2 undertyper på minst 2 nivåer i ringens band. Inga tomma celler."""
import sys; sys.dont_write_bytecode = True
import json,os,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from spelregler import L,ringar,biompool,vikter,cell,zoner,grannfel
d=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
w=L(d,'varld_stor.json'); m=L(d,'monsterfamiljer.json'); mn=L(d,'monster_niva.json'); gen=L(d,'varldsgenerator.json'); dt=L(d,'drop_tabeller.json')
M={x['id']:x for x in m['monsters']}; fl=mn['fixed_levels']; R=ringar(w)
print('biom   '+''.join(f'r{r}[{a}-{b}]'.ljust(11) for r,(a,b) in R.items()))
luckor=0; tunna=[]; fel=set()
for b,v in w['biomer'].items():
    fams=set(v['monsterfamiljer']); row=''
    for g in v['egna_monster']:
        if g['familj'] not in fams: fel.add(f'{b}/{g["id"]}: familj {g["familj"]} saknas i biomens monsterfamiljer')
        for u in g['undertyper_nu']:
            x=M.get(u)
            if not x: fel.add(f'{b}/{g["id"]}: {u} saknas'); continue
            if x['family']!=g['familj']: fel.add(f'{b}/{g["id"]}: {u} är {x["family"]}, gruppen {g["familj"]} (mix)')
            if not g['nivaband'][0]<=x['level']<=g['nivaband'][1]: fel.add(('INFO platshållare ' if g['platshallare'] else '')+f'{b}/{g["id"]}: {u} nivå {x["level"]} utanför gruppens band {g["nivaband"]}')
    for r,band in R.items():
        c=cell(v,M,fl,band); n=len({u for l in c.values() for u in l}); row+=str(n).ljust(11); luckor+= not c
        for f,us in c.items():
            if len(us)<2 or len({fl[u] for u in us})<2: tunna.append(f'{b} r{r} {f}: {us}')
    print(b.ljust(7)+row)
for x in m['monsters']:
    if fl.get(x['id'])!=x['level']: fel.add(f'fixed_levels saknar eller fel för {x["id"]}')
    if x['id'] not in dt['monsters'] and x['id'] not in dt['bosses']: fel.add(f'drop_tabeller saknar {x["id"]}')
for k,t in list(dt['monsters'].items())+list(dt['bosses'].items()):
    if k not in M: fel.add(f'drop_tabeller: okänt monster {k}')
    elif t['family']!=M[k]['family'] or t['monster_level']!=M[k]['level']: fel.add(f'drop_tabeller {k}: familj/nivå stämmer inte')
Z=zoner(d)
for k,z in Z.items():
    if z and M[k]['zones']!=z: fel.add(f'zones för {k} är {M[k]["zones"]}, ska vara {z}')
print('luckor:',luckor); print('tunna celler (familj med < 2 undertyper eller 1 nivå):',len(tunna)); print('\n'.join(tunna))
# andel per undertyp i mellanmarken (modell: chunkar inom radie 40, biomen lika stora per ring, familj lika sannolik, vikter enligt varldsgenerator)
rad=40; ring_tab=w['meta']['zonmodell']['ringar']; vikt_ring={}
for x in range(-rad,rad+1):
    for y in range(-rad,rad+1):
        dd=(x*x+y*y)**.5
        if dd>rad: continue
        for r in ring_tab:
            if r['fran']<=dd<(r['till'] or 1e9):
                if r['ring']>=1: vikt_ring[r['ring']]=vikt_ring.get(r['ring'],0)+1
def andelar(Rx,med_vikt):
    andel={}; tot=0
    for r,band in Rx.items():
        for b,v in w['biomer'].items():
            c=cell(v,M,fl,band); vk=vikter(v,gen) if med_vikt else {}
            if not c: continue
            pc=vikt_ring[r]/len(w['biomer'])/len(c)
            for f,us in c.items():
                s=sum(vk.get(u,1) for u in us)
                for u in us: andel[u]=andel.get(u,0)+pc*vk.get(u,1)/s
            tot+=vikt_ring[r]/len(w['biomer'])
    return {u:a/tot for u,a in andel.items()}
R6=dict(R); R6[7]=R[6]
print('andel av mellanmarksspawn (modell, radie 40, ring 7 =',f'{100*vikt_ring[7]/sum(vikt_ring.values()):.0f}% av chunkarna):')
for namn,Rx in (('designband',R),('ring 7 med band 24 till 30 (kod före F4)',R6)):
    for med_vikt in (False,True):
        a=andelar(Rx,med_vikt); top=sorted(a.items(),key=lambda t:-t[1])[:5]
        print(f'  {namn}, {"med" if med_vikt else "utan"} vikter: '+', '.join(f'{u} {100*x:.1f}%' for u,x in top)+(f' | sprickvasen {100*a.get("sprickvasen",0):.1f}%'))
        if med_vikt and Rx is R:
            for u,g in gen['monsterpooler'].get('vikter',{}).get('max_andel',{}).items():
                if a.get(u,0)>g: fel.add(f'{u} andel {100*a[u]:.1f}% över max {100*g:.0f}%')
fel|=set(grannfel(d))
import math
# lägrets NPC:er står 1 till 4,1 enheter från elden (Tor 4,1); regeln är högst 12
npc=L(d,'npc.json'); eld=w['meta']['startskogen_fotavtryck']['lager_ankare']['lagerelden']
for x in npc['npcs']:
    if x.get('omrade')=='startlagret' and (x.get('area')!='startskogen' or not x.get('pos') or math.dist(x['pos'],eld)>12): fel.add(f'lägernpc {x["id"]} står inte inom 12 från lägerelden {eld}')
for r in w['regioner']:
    if r.get('boss') and r['boss'] not in M: fel.add(f'INFO boss {r["boss"]} i {r["id"]} saknas i monsterfamiljer (ej designad)')
print('\n'.join(sorted(fel)) if fel else 'inga fel')
