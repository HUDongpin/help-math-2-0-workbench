function setAll()
{
   reintKTermsBox();
   _root.keyterms_but.enabled = true;
}
function Deact()
{
   resetAll();
   reintKTermsBox();
   _root.deactAll._visible = true;
   _root.deactAll.useHandCursor = false;
}
function Activ()
{
   setAll();
   _root.deactAll._visible = false;
   _root.deactAll.useHandCursor = false;
}
_root.top._y = _root.top_initial._y;
_root.bottom._y = _root.bottom_initial._y;
Activ();
if(_global.bookMark != false && _root.dtfBMID.text != "" && _root.dtfBMID.text != undefined && _root.dtfBMID.text != "undefined")
{
   _root.stop();
   _root.bookmark_mc.gotoAndStop(2);
}
else if(_global.sectionNumber == 0 || _global.sectionNumber == undefined)
{
   _global.sectionNumber = 1;
   _global.slideNumber = 2;
   _global.playSwfFileName = _global.tempURL + "/IR/" + _global.arrSection1_Details[_global.slideNumber];
}
