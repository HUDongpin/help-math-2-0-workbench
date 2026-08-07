function visible()
{
   _root.doVisibleKeyAlphBut();
}
function doGetSubLink(subLinkWord)
{
   _root.doCreateSubLink(subLinkWord);
}
function C_L(M_Name)
{
   _root.doCreateGlossaryWord(M_Name);
}
function C_S(M_Name, Word)
{
   _root.doCreateGlossAlph(M_Name,Word);
}
_root.doInitKeyTerms();
_root.glossary.keyterms.a.onRelease = function()
{
   _root.doCreateButAction("a");
};
_root.glossary.keyterms.b.onRelease = function()
{
   _root.doCreateButAction("b");
};
_root.glossary.keyterms.c.onRelease = function()
{
   _root.doCreateButAction("c");
};
_root.glossary.keyterms.d.onRelease = function()
{
   _root.doCreateButAction("d");
};
_root.glossary.keyterms.e.onRelease = function()
{
   _root.doCreateButAction("e");
};
_root.glossary.keyterms.f.onRelease = function()
{
   _root.doCreateButAction("f");
};
_root.glossary.keyterms.g.onRelease = function()
{
   _root.doCreateButAction("g");
};
_root.glossary.keyterms.h.onRelease = function()
{
   _root.doCreateButAction("h");
};
_root.glossary.keyterms.useri.onRelease = function()
{
   _root.doCreateButAction("i");
};
_root.glossary.keyterms.j.onRelease = function()
{
   _root.doCreateButAction("j");
};
_root.glossary.keyterms.userk.onRelease = function()
{
   _root.doCreateButAction("k");
};
_root.glossary.keyterms.l.onRelease = function()
{
   _root.doCreateButAction("l");
};
_root.glossary.keyterms.m.onRelease = function()
{
   _root.doCreateButAction("m");
};
_root.glossary.keyterms.n.onRelease = function()
{
   _root.doCreateButAction("n");
};
_root.glossary.keyterms.o.onRelease = function()
{
   _root.doCreateButAction("o");
};
_root.glossary.keyterms.p.onRelease = function()
{
   _root.doCreateButAction("p");
};
_root.glossary.keyterms.q.onRelease = function()
{
   _root.doCreateButAction("q");
};
_root.glossary.keyterms.r.onRelease = function()
{
   _root.doCreateButAction("r");
};
_root.glossary.keyterms.s.onRelease = function()
{
   _root.doCreateButAction("s");
};
_root.glossary.keyterms.t.onRelease = function()
{
   _root.doCreateButAction("t");
};
_root.glossary.keyterms.u.onRelease = function()
{
   _root.doCreateButAction("u");
};
_root.glossary.keyterms.v.onRelease = function()
{
   _root.doCreateButAction("v");
};
_root.glossary.keyterms.w.onRelease = function()
{
   _root.doCreateButAction("w");
};
_root.glossary.keyterms.x.onRelease = function()
{
   _root.doCreateButAction("x");
};
_root.glossary.keyterms.y.onRelease = function()
{
   _root.doCreateButAction("y");
};
_root.glossary.keyterms.z.onRelease = function()
{
   _root.doCreateButAction("z");
};
_root.glossary.keyterms.BtnReset.onRelease = function()
{
   _root.doKeyTermsReset();
};
_root.glossary.keyterms.BtnSpan.onRelease = function()
{
   _root.doSwitchSpanGloss();
};
_root.glossary.keyterms.BtnEng.onRelease = function()
{
   _root.doSwitchEngGloss();
};
_root.glossary.keyterms.BtnBack.onRelease = function()
{
   _root.glossary.keyterms.doGetSubLink(_global.backLinkWord);
   _root.glossary.keyterms.BtnBack._visible = false;
};
_root.glossary.keyterms.BtnClose.onRelease = function()
{
   var _loc1_ = _global;
   _loc1_.Play = true;
   _loc1_.Pause = false;
   _loc1_.CompClick = "";
   _root.glossary._visible = false;
};
