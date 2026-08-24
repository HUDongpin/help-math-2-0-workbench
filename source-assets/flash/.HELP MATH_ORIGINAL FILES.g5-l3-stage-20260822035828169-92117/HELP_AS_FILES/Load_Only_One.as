stop();
_root.doInitKeyTerms();
if(_global.newTitleTag==true) {
	_root.animation_mc.Mc_Page_Title._visible=false;
	_root.animation_mc["Mc_Page_Title  "]._visible=false;
	_root.animation_mc.animation.Mc_Page_Title._visible=false;
	_root.animation_mc.animation["Mc_Page_Title  "]._visible=false;
		
	_root.txtNewTitle.text = _global.newTitleText;
	myTextFormat = new TextFormat();
	myTextFormat.font = _global.newTitleFontName;
	myTextFormat.size = _global.newTitleFontSize;
	myTextFormat.color = "0x"+_global.newTitleFontColor;
	_root.txtNewTitle.setTextFormat(myTextFormat);		
} else {
	_root.animation_mc.Mc_Page_Title._visible=true;
	_root.animation_mc["Mc_Page_Title  "]._visible=true;
	_root.animation_mc.animation.Mc_Page_Title._visible=true;
	_root.animation_mc.animation["Mc_Page_Title  "]._visible=true;
		
	_root.animation_mc.Mc_Page_Title._visible=true;
	_root.txtNewTitle.text = "";		
}

_root.Mc_Course_Title._visible=false;

_root.glossary.McKeyTermAngle1._visible=false;
_root.glossary.McKeyTermAngle2._visible=false;
_root.doCreateSlide();

// Scenario Script
_root.title._visible = true;
// End of scenario Script

_root.top._y = _root.top_initial._y;
_root.sideNavcontent._visible = true;
_root.sideNav._visible = true;
_root.sideexample._visible = true;
_root.sideNav.dis.gotoAndStop(1);
_root.map.enabled = true;
_root.glossary._visible = false;
_root.m_c.gotoAndStop("hide");
_root.calculator._visible = false;
_root.Mc_Formulas._visible = false;
_root.l_s.gotoAndStop("map");
_global.quizSection = false;
_root.doPutBackAndFinished();
_root.loadSWFMovie();