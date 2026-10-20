# Route definitions from AP duty sheets (nuo 2026-10-05) + operator description.
# Each direction: 'main' = regular cycle (solid line); 'var' = occasional branches (dashed).
# A variant is a list of posters; it must start and/or end at a stop of 'main' (its anchor).
AS='autobusu-stotis'
# centre, outbound from AS towards Pieninė / Užupis
LIG_C='ligonine_-link-centro'; KUD_C='kudirkos_-link_centro'; AUTOS='autoservisas'
# centre, inbound towards AS
LIG_AS='ligonine'; KUD_AS='kudirkos'; ANYK='anyksciu'; BASAN='basanaviciaus'
KES_P='kestucio-a-link-pienines'; KES_AS='kestucio-a-link-autobusu-stoties'
KAU_P='kauno-link-pienines'; KAU_C='kauno-link-centro'
SP_P='senasis-pastas-link-pienines'; SP_C='senasis-pastas-link-centro'
PRA_P='pramones-link-pienines'; PRA_C='pramones-link-centro'
UME_P='umega-link-pienines'; UME_AS='umega-link-autobusu-stoties'; PIEN='pienine'
VYT_C='autobusu-stotis-vytauto-g-link-centro'; VYT_D='autobusu-stotis-vytauto-g-link-dukstynos'
SOD_D='sodai-link-dukstynos'; SOD_C='sodai-link-centro'
DK_D='dukstynos-kaimas-link-dukstynos'; DK_C='dukstyvos_kaimas-link-centro'; DUK='dukstyna-link-centro'
ZAL='zaliasis-vienkiemis'
# Žaliasis vienkiemis -> town  /  town -> Žaliasis vienkiemis
SAL_T='saltalankiu-link-centro'; KRE_T='kreksliai'; VYS_T='vysniu'; BOR_T='boruvka-link-centro'; GEL_T='gelzbetonis-link-centro'; ANT_T='antakalnio-link-centro'
SAL_Z='saltalankiu-savaitgalinis'; KRE_Z='kreksliai-savaitgalinis'; VYS_Z='vysniu-savaitgalinis'; BOR_Z='boruvka-link-zaliojo-vienkiemio'; GEL_Z='gelzbetonis-savaitgalinis'; ANT_Z='antakalnio-link-zaliojo-vienkiemio'
DG='gelzbetonis-dariaus-ir-gireno'
MUZ_C='muziejaus'; MUZ_U='muziejus-savaitgalinis'
SME_P='smeliu-link-pasiles'; SME_C='smeliu'
PIV_P='pivonijos-link-pasiles'; PIV_C='pivonijos'
PUS_P='pusu-link-pasiles'; PUS_C='pusu'; KOK='kokliu-link-centro'
MIS_P='misku-link-pasiles'; MIS_C='misku'
KRY_P='pasiles-kryzkele-link-pasiles'; KRY_C='pasiles-kryzkele'
BAZ_P='baznycios-link-pasile'; BAZ_C='baznycios'; PAS='pasile'; VAR='varine'
LIN_G='linu-link-gamyklu'; GEL_G='geliu-link-gamyklu'; GAM='gamyklu'; GEL_P='geliu-link-pivonijos'; LIN_P='linu-link-pivonijos'
ZIE_N='ziedo-link-narbuto'; ZIE_AS='ziedo-link-autobusu-stoties'; NAR='narbuto'
LYT_B='lytagros-centras-link-biofabriko'; LYT_C='lytagros-centras-link-autobusu-stoties'
STA_B='statikai-link-biofabriko'; STA_C='statikai'
BIO_D='biofabrikas-link-deltuvos'; BIO_C='biofabrikas-link-centro'
STI_D='statikai1'; STI_C='statikai-link-autobusu-stoties'
SDD_D='sodai-link-deltuvos'; SDD_C='sodai-link-autobusu-stoties'
DKP_D='deltuvos-kapines-link-deltuvos'; DKP_C='deltuvos-kapines-link-centro'; DEL='deltuva-link-autobusu-stoties'
TUR='turgus'

R1_A=[AS,LIG_C,KUD_C,AUTOS,KES_P,KAU_P,SP_P,PRA_P,UME_P,PIEN]
R1_B=[PIEN,UME_AS,PRA_C,SP_C,KAU_C,KES_AS,BASAN,KUD_AS,ANYK,LIG_AS,AS]
R1={'A':dict(to='Pieninė',main=R1_A,var=[[DUK,DK_C,SOD_C,VYT_C,LIG_C],[DUK,DK_C,SOD_C,AS]]),
    'B':dict(to='Autobusų stotis',main=R1_B,var=[[LIG_AS,VYT_D,SOD_D,DK_D,DUK],[NAR,PRA_C]])}
R1_WE={'A':dict(to='Pieninė',main=R1_A,var=[[DUK,DK_C,SOD_C,VYT_C,LIG_C],[DUK,DK_C,SOD_C,AS]]),'B':dict(to='Autobusų stotis',main=R1_B,var=[[LIG_AS,VYT_D,SOD_D,DK_D,DUK]])}

R2W_K=[BIO_C,STA_C,LYT_C,ZIE_AS,PRA_C,SP_C,KAU_C,KES_AS,BASAN,KUD_AS,ANYK,LIG_AS,AS,SOD_D,DK_D,ZAL,SAL_T,KRE_T,VYS_T,BOR_T,DG,PUS_P,KOK]
R2W_B=[KOK,PUS_C,PIV_C,SME_C,KES_P,KAU_P,SP_P,PRA_P,ZIE_N,LYT_B,STA_B,BIO_D]
DELT_IN=[DEL,DKP_C,SDD_C,STI_C,BIO_C]; DELT_OUT=[BIO_D,STI_D,SDD_D,DKP_D,DEL]
R2W={'A':dict(to='Koklių f.',main=R2W_K,var=[DELT_IN,['#',LIG_AS,VYT_D,SOD_D]]),'B':dict(to='Biofabrikas',main=R2W_B,var=[DELT_OUT,['^',AS,LIG_C,KUD_C,AUTOS,KES_P],['#',ZIE_N,BIO_D],[ZIE_N,NAR,'$']])}
R2E_K=[BIO_C,STA_C,LYT_C,ZIE_AS,PRA_C,SP_C,KAU_C,KES_AS,MUZ_U,SME_P,PIV_P,PUS_P,KOK]
R2E_B=[KOK,PUS_C,PIV_C,SME_C,KES_P,KAU_P,SP_P,PRA_P,ZIE_N,LYT_B,STA_B,BIO_D]
R2E={'A':dict(to='Koklių f.',main=R2E_K,var=[[KOK,MIS_P,KRY_P,BAZ_P,PAS],['#',TUR,KES_AS],['^',AS,LIG_C,KUD_C,AUTOS,MUZ_U],[KES_AS,BASAN,KUD_AS,ANYK,LIG_AS,AS,'$'],['#',BIO_C,ZIE_AS]]),
     'B':dict(to='Biofabrikas',main=R2E_B,var=[[PAS,BAZ_C,KRY_C,MIS_C,KOK],[SME_C,TUR]])}

R3={'A':dict(to='Turgus',main=[ZAL,SAL_T,KRE_T,VYS_T,BOR_T,GEL_T,ANT_T,MUZ_C,TUR],var=[[MUZ_C,BASAN,KUD_AS,ANYK,LIG_AS,AS,'$']]),
    'B':dict(to='Žaliasis vienkiemis',main=[TUR,KES_AS,MUZ_U,ANT_Z,GEL_Z,BOR_Z,VYS_Z,KRE_Z,SAL_Z,ZAL],var=[['^',AS,LIG_C,KUD_C,AUTOS,MUZ_U]])}

R4_B=[PAS,BAZ_C,KRY_C,MIS_C,PUS_C,PIV_C,SME_C,MUZ_C,BASAN,KUD_AS,ANYK,LIG_AS,AS]
R4W={'A':dict(to='Pašilė',main=[VYT_D,SOD_D,DK_D,ZAL,SAL_T,KRE_T,VYS_T,BOR_T,GEL_T,ANT_T,SME_P,PIV_P,PUS_P,MIS_P,KRY_P,BAZ_P,PAS],
              var=[['#',AS,VYT_D],[DK_D,DUK,ZAL],[PAS,VAR],[BOR_T,PUS_P],
                   [NAR,ZIE_AS,PRA_C,SP_C,KAU_C,KES_AS,BASAN,KUD_AS,ANYK,LIG_AS,VYT_D],[SME_P,LIN_G,GEL_G,GAM,GEL_P,LIN_P,PIV_P]]),
     'B':dict(to='Autobusų stotis',main=[PAS,BAZ_C,KRY_C,MIS_C,PUS_C,PIV_C,SME_C,MUZ_C,BASAN,KUD_AS,ANYK,LIG_AS,VYT_D],
              var=[[VAR,PAS],['#',LIG_AS,AS],['^',KES_AS,BASAN]])}
R4E={'A':dict(to='Pašilė',main=[AS,LIG_C,KUD_C,AUTOS,MUZ_U,SME_P,PIV_P,PUS_P,MIS_P,KRY_P,BAZ_P,PAS],var=[]),
     'B':dict(to='Autobusų stotis',main=R4_B,var=[])}

R5={'A':dict(to='Narbuto',main=[PAS,BAZ_C,KRY_C,MIS_C,PUS_C,PIV_C,LIN_G,GEL_G,GAM,GEL_P,LIN_P,SME_C,MUZ_C,KES_P,KAU_P,SP_P,PRA_P,ZIE_N,NAR],var=[])}

R6W={'A':dict(to='Žaliasis vienkiemis ir atgal į AS',main=[AS,SOD_D,DK_D,ZAL,SAL_T,KRE_T,VYS_T,BOR_T,GEL_T,ANT_T,MUZ_C,BASAN,KUD_AS,ANYK,LIG_AS,AS],var=[])}
R6E={'A':dict(to='Žaliasis vienkiemis',main=[AS,LIG_C,KUD_C,AUTOS,MUZ_U,ANT_Z,GEL_Z,BOR_Z,VYS_Z,KRE_Z,SAL_Z,ZAL],var=[[DUK,DK_C,SOD_C,VYT_C,LIG_C]]),
     'B':dict(to='Autobusų stotis',main=[ZAL,SAL_T,KRE_T,VYS_T,BOR_T,GEL_T,ANT_T,MUZ_C,BASAN,KUD_AS,ANYK,LIG_AS,AS],var=[[LIG_AS,VYT_D,SOD_D,DK_D,DUK]])}

R7={'A':dict(to='Narbuto',main=[ZAL,SAL_T,KRE_T,VYS_T,BOR_T,GEL_T,ANT_T,MUZ_C,BASAN,KUD_AS,ANYK,LIG_AS,AS,LIG_C,KUD_C,AUTOS,KES_P,KAU_P,SP_P,PRA_P,ZIE_N,NAR],var=[])}

# mode D = darbo dienos, O = savaitgaliai/šventės
ROUTES={'1':{'D':R1,'O':R1_WE},'2':{'D':R2W,'O':R2E},'3':{'O':R3},'4':{'D':R4W,'O':R4E},'5':{'D':R5},'6':{'D':R6W,'O':R6E},'7':{'D':R7}}
