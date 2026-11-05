"""Täthet och XP-takt per ring i storvärlden.
Användning: python3 spel/design/verktyg/tathet.py [designmapp] [--forslag]
Läser tätheten ur data: varldsgenerator.json monsterpooler.tathet (mellanmark per ring), varld_stor.json regioner[].tathet
(namngivna regioner) och bana1_stor.json delomraden (monster_per_game per delområde). XP per kill med spelets formel (spelregler.Xp: round(xp/10 × 3 × L^1,5 × avdrag × bossfaktor), ett kill i taget),
boss_xp_faktor tillämpas av verktyget. Hjälten rensar alla namngivna platser i ringen och andelen utforskad_andel av mellanmarken.
--forslag räknar ut bossarnas XP-faktor per akt (monster_niva.json boss_xp_faktor) med tätheten i data. Faktorn i data behålls om ringen redan landar på målnivån; annars väljs största faktorn (högst 1) som stannar inom 80 procent av målnivån.
--forslag-tathet räknar ut den mellanmarkstäthet per ring som ger målnivån vid ringens yttre kant."""
import sys; sys.dont_write_bytecode = True
import json,os,sys,math
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from spelregler import L,ringar,cell,vikter,Xp
args=[a for a in sys.argv[1:] if not a.startswith('--')]; FORSLAG='--forslag-tathet' in sys.argv; BOSSF='--forslag' in sys.argv
d=args[0] if args else os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
w=L(d,'varld_stor.json'); m=L(d,'monsterfamiljer.json'); mn=L(d,'monster_niva.json'); gen=L(d,'varldsgenerator.json'); b=L(d,'bana1_stor.json'); s=L(d,'spawnzoner.json')
M={x['id']:x for x in m['monsters']}; SA={a['id']:a for a in s['areas']}; fl=mn['fixed_levels']; T=gen['monsterpooler']['tathet']
X=Xp(d)
def lvl(xp): return X.lvl(xp)
def tot(l): return X.tot[l-1]
ring_tab=w['meta']['zonmodell']['ringar']; R=ringar(w)
def ring_of(cx,cy):
    dd=math.hypot(cx,cy)
    for r in ring_tab:
        if r['fran']<=dd<(r['till'] or 1e9): return r['ring']
reg={r['id']:r for r in w['regioner']}; dl={tuple(x['chunk']):x for x in b['delomraden']}
def owner(cx,cy):
    if (cx,cy) in dl: return ('del',dl[(cx,cy)]['id'])
    c=[(math.hypot(cx-r['chunk'][0],cy-r['chunk'][1]),r['id']) for r in w['regioner'] if max(abs(cx-r['chunk'][0]),abs(cy-r['chunk'][1]))<=r['radie']]
    return ('reg',min(c)[1]) if c else ('mell',None)
def nearest_biome(cx,cy): return min(w['regioner'],key=lambda r:math.hypot(cx-r['chunk'][0],cy-r['chunk'][1]))['biom']
RMAX=T.get('modell_radie',15)
chunks=[(x,y) for x in range(-RMAX,RMAX+1) for y in range(-RMAX,RMAX+1) if math.hypot(x,y)<RMAX]
own={c:owner(*c) for c in chunks}
regchunks={}
for c,o in own.items():
    if o[0]=='reg': regchunks.setdefault(o[1],[]).append(c)
def pool_avg(ids): return [(u,1/len(ids)) for u in ids]
K2={k['region']:k['tabell'] for k in b['nivakurva'].get('ring_2_kontroll',[])}
def region_pool(rid):
    t=K2.get(rid)
    if t and t.startswith('spawnzoner'): et=SA[t.split('areas.')[1].split()[0].strip(')')]['enemy_table']; W=sum(e['weight'] for e in et); return [(e['enemy'],e['weight']/W) for e in et]
    if t:
        par=[x.split() for x in t.split(',')]; W=sum(float(x[1]) for x in par); return [(x[0],float(x[1])/W) for x in par]
    if reg[rid].get('typ')=='stad' and rid in SA:
        et=SA[rid]['enemy_table']; W=sum(e['weight'] for e in et); return [(e['enemy'],e['weight']/W) for e in et]
    return pool_avg(reg[rid]['undertyper'])
def cellpool(biom,ring):
    v=w['biomer'][biom]; c=cell(v,M,fl,R[ring]); vk=vikter(v,gen); out=[]
    for f,us in c.items():
        sw=sum(vk.get(u,1) for u in us)
        for u in us: out.append((u,vk.get(u,1)/sw/len(c)))
    return out
def mell_density(ring): v=gen['monsterpooler']['tathet_per_chunk'][f'ring_{ring}']; return (v[0]+v[1])/2
MIN=T.get('min_per_chunk',0)
GOLV=T.get('region_golv',1.0)
EL=gen['monsterpooler'].get('elit_modell',{'fran_ring':2,'chans_per_grupp':0.10})  # champions i mellanmarken: andel monster i championgrupper, XP × 3 och nivå + 1
# innehåll per ring: lista (antal, pool, boss)
def content(dens):
    named={k:[] for k in range(0,8)}; mell={k:[] for k in range(0,8)}; cnt={k:[0,0,0] for k in range(0,8)}; bossar=set()
    for c,o in own.items():
        r=ring_of(*c); cnt[r][0]+=1
        if o[0]=='del':
            x=dl[c]; t=x['enemy_table']
            if isinstance(t,str): t=SA[x['region']]['enemy_table']
            W=sum(e['weight'] for e in t)
            named[r].append((x['monster_per_game'],[(e['enemy'],e['weight']/W) for e in t])); cnt[r][1]+=1
            reg_id=x['region']
        else:
            reg_id=o[1] if o[0]=='reg' else None
            if reg_id and reg[reg_id].get('tathet') is not None and 'monster_per_game' in reg[reg_id]['tathet']:
                t=reg[reg_id]['tathet']; ids=reg[reg_id]['undertyper']
                n=max(t['monster_per_game']/len(regchunks[reg_id]),dens[r]*GOLV) if t['monster_per_game'] else 0  # regionens öppna chunkar har minst region_golv × mellanmarkens täthet (varld_stor.json meta.tathet_regel)
                if ids and n: named[r].append((n,region_pool(reg_id)))
                cnt[r][1]+=1
            else:
                biom=reg[reg_id]['biom'] if reg_id else nearest_biome(*c)
                pool=pool_avg(reg[reg_id]['undertyper']) if reg_id and reg[reg_id]['undertyper'] else cellpool(biom,max(r,1))
                if r>=EL['fran_ring'] and EL['chans_per_grupp']: pool=[(u,a*(1-EL['chans_per_grupp'])) for u,a in pool]+[(u,a*EL['chans_per_grupp'],'champion') for u,a in pool]
                mell[r].append((dens[r],pool)); cnt[r][2]+=1
        if reg_id and reg[reg_id].get('boss') in M and reg_id not in bossar:
            bossar.add(reg_id); named[ring_of(*reg[reg_id]['chunk'])].append((1,[(reg[reg_id]['boss'],1.0)],'boss'))
    return named,mell,cnt
def simulate(dens,andel):
    named,mell,cnt=content(dens); xp=0; rows=[]
    for r in range(0,8):
        x0=xp
        fn=andel['namngivna_ring_0_till_2'] if r<=2 else andel['namngivna_ring_3_och_ut']
        um=T.get('utforskade_mellanmarkschunkar',{}).get(f'ring_{r}')
        fm=andel['mellanmark'] if um is None or not mell[r] else min(1.0,um/len(mell[r]))
        for part,f in ((named[r],fn),(mell[r],fm)):
            for it in part:
                n,pool=it[0],it[1]; boss=len(it)>2
                xp=X.gain(xp,(andel['bossar'] if boss else f)*n,pool)
        rows.append((r,cnt[r],dens[r],round(xp-x0),round(xp),lvl(xp)))
    return rows
andel=T['utforskad_andel']; mal={int(k.split('_')[1]):v for k,v in T['malniva_yttre_kant'].items()}
dens={r:mell_density(r) for r in range(0,8)}
if FORSLAG:
    for r in range(0,7):
        lo,hi=float(MIN),30.0
        goal=tot(mal[r])+0.3*(tot(mal[r]+1)-tot(mal[r])) if mal[r]<30 else tot(30)
        for _ in range(40):
            mid=(lo+hi)/2; dens[r]=mid
            if simulate(dens,andel)[r][4]<goal: lo=mid
            else: hi=mid
        dens[r]=round((lo+hi)/2,2)
    dens[7]=dens[6]
    print('förslag mellanmark monster per chunk:',{f'ring_{r}':v for r,v in dens.items()})
BX=mn.get('boss_xp_faktor')
if BOSSF and BX:
    fakt=dict(BX['per_akt'])
    def apply(): X.per_akt.update(fakt)
    for akt in sorted(fakt):
        k=int(akt.split('_')[1])
        r=k+1; tak=tot(mal[r])+0.8*(tot(mal[r]+1)-tot(mal[r])) if mal[r]<30 else 1e12
        # största faktor (högst 1) där kumulativ XP vid ringens yttre kant stannar inom målnivån (80 procent in i nivån)
        apply()
        if mal[r]<30 and simulate(dens,andel)[r][5]==mal[r]: continue  # faktorn i data håller målnivån, ändra inte
        lo,hi=0.0,1.0; fakt[akt]=1.0; apply()
        if simulate(dens,andel)[r][4]>tak:
            for _ in range(30):
                mid=(lo+hi)/2; fakt[akt]=mid; apply()
                if simulate(dens,andel)[r][4]>tak: hi=mid
                else: lo=mid
            fakt[akt]=math.floor(lo*100)/100
        apply()
    print('förslag boss_xp_faktor per akt:',fakt)
print(f'utforskad andel {andel}, modellradie {RMAX} chunkar (ring 7 bara innanför radien)')
print('ring  chunkar(namngivna/mellanmark)  monster/chunk mellanmark  XP i ringen  XP kumulativ  nivå  mål')
for r,c,dn,x,cx,l in simulate(dens,andel):
    print(f'{r:<5} {c[0]:>4} ({c[1]}/{c[2]})'.ljust(37)+f'{dn:<25}{x:<13}{cx:<14}{l:<6}{mal.get(r,"")}')
