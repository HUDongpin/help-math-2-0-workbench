//Vars Starts
LessonDetails = "[CourseDetails]~CourseName,Counting on Numbers~LessonName,Counting on Numbers~TotalSection,8[Details_Split][Section1Details]~IR~L13RW01.swf[Details_Split][Section2Details]~RW~L13RW02.swf~L13RW03.swf~L13RW04.swf[Details_Split][Section3Details]~VB~L13VB01.swf~L13VB02.swf~L13VB03.swf~L13VB04.swf~L13VB05.swf~L13VB06.swf~L13VB07.swf~L13VB08.swf~L13VB09.swf~L13VB10.swf~L13VB11.swf~L13VB12.swf~L13VB13.swf~L13VB14.swf~L13VB15.swf~L13VB16.swf~L13VB17.swf~L13VB18.swf~L13VB19.swf~L13VB20.swf[Details_Split][Section4Details]~IN~L13IN01.swf~L13IN02.swf~L13IN03.swf~L13IN04.swf~L13IN05.swf~L13IN06.swf~L13IN07.swf~L13IN08.swf~L13IN09.swf~L13IN10.swf~L13IN11.swf~L13IN12.swf~L13IN13.swf~L13IN14a.swf~L13IN14b.swf~L13IN15a.swf~L13IN15b.swf~L13IN16.swf~L13IN17a.swf~L13IN17b.swf~L13IN18.swf~L13IN19.swf~L13IN20.swf~L13IN21a.swf~L13IN21b.swf~L13IN22.swf~L13IN23.swf~L13IN24.swf~L13IN25.swf~L13IN26.swf[Details_Split][Section5Details]~TI~L13TI01.swf~L13TI02.swf~L13TI03.swf~L13TI04.swf~L13TI05.swf~L13TI06.swf~L13TI07.swf~L13TI08.swf~L13TI09.swf~L13TI10.swf~L13TI11.swf[Details_Split][Section6Details]~GS~L13GS01.swf~L13GS02.swf[Details_Split][Section7Details]~TS~L13TS01.swf~L13TS02.swf~L13TS03.swf~L13TS04.swf~L13TS05.swf~L13TS06.swf~L13TS07.swf~L13TS08.swf[Details_Split][Section8Details]~FQ~L13FQ01.swf~L13FQ02.swf~L13FQ03.swf";
SlideSpaceDetails = "[Section1Details]~IR[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~3~6~10~12~13[Details_Split][Section4Details]~IN~4~5~7~8~9~10~13~15~16~17~18~19[Details_Split][Section5Details]~TI[Details_Split][Section6Details]~GS[Details_Split][Section7Details]~TS[Details_Split][Section8Details]~FQ";
RandomAudioDetails = "[Section1Details]~IR~L13RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L13VB01.swf[Details_Split][Section4Details]~IN~L13IN01.swf[Details_Split][Section5Details]~TI~L13TI01.swf[Details_Split][Section6Details]~GS~L13GS01.swf[Details_Split][Section7Details]~TS";
BGTextDetails = "[Section1Details]~IR~L13RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L13VB01.swf[Details_Split][Section4Details]~IN~L13IN01.swf[Details_Split][Section5Details]~TI~L13TI01.swf[Details_Split][Section6Details]~GS~L13GS01.swf[Details_Split][Section7Details]~TS~L13TS01.swf";
//Vars End
function doCreateSlide() {
	for (i=2; i<_global.arrSection1_Details.length; i++) {
		//trace(_global.arrSection1_Details[i]);
		mcName = _global.arrSection1_Details[i].substring(0, _global.arrSection1_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection2_Details.length; i++) {
		//trace(_global.arrSection1_Details[i]);
		mcName = _global.arrSection2_Details[i].substring(0, _global.arrSection2_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection3_Details.length; i++) {
		mcName = _global.arrSection3_Details[i].substring(0, _global.arrSection3_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection4_Details.length; i++) {
		mcName = _global.arrSection4_Details[i].substring(0, _global.arrSection4_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection5_Details.length; i++) {
		mcName = _global.arrSection5_Details[i].substring(0, _global.arrSection5_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection6_Details.length; i++) {
		mcName = _global.arrSection6_Details[i].substring(0, _global.arrSection6_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection7_Details.length; i++) {
		mcName = _global.arrSection7_Details[i].substring(0, _global.arrSection7_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection8_Details.length; i++) {
		mcName = _global.arrSection8_Details[i].substring(0, _global.arrSection8_Details[i].length-4);
		removeMovieClip(mcName);
	}
	var flgExists:Boolean;
	flgExists = false;
	var mcName:String;
	var intSlideNum:Number;
	if (_global.sectionNumber == 1) {
		slideName = new Array();
		slideName[0] = "Introduction";
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		for (i=2; i<_global.arrSection1_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection1_Details[i].substring(0, _global.arrSection1_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec1_Details.length; j++) {
					if (_global.arrSSDSec1_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide1 = true;
	}
	if (_global.sectionNumber == 2) {
		var slideSpace:Boolean;
		mcX = 16;
		//intSlideNum = 0;
		intSlideNum = 1;
		slideName = new Array();
		//slideName[0] = "Introduction";
		slideName[1] = "Page 1";
		slideName[2] = "Page 2";
		slideName[3] = "Page 3";
		//slideName[4] = "Page 4";
		for (i=2; i<_global.arrSection2_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection2_Details[i].substring(0, _global.arrSection2_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec2_Details.length; j++) {
					if (_global.arrSSDSec2_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide2 = true;
	}
	//////   vb
	if (_global.sectionNumber == 3) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		slideName[0] = "Introduction";
		slideName[1] = "Angles";
		slideName[2] = "Right Angle, Acute Angle, and Obtuse Angle";
		slideName[3] = "Right Angle, Acute Angle, and Obtuse Angle";
		slideName[4] = "Right Angle, Acute Angle, and Obtuse Angle";
		slideName[5] = "Right Angle, Acute Angle, and Obtuse Angle";
		slideName[6] = "Measure, Degree";
		slideName[7] = "Measure–Practice";
		slideName[8] = "Parallel Lines";
		slideName[9] = "Perpendicular Lines";
		slideName[10] = "Parallel and Perpendicular Lines-Practice";
		slideName[11] = "Parallel and Perpendicular Lines-Practice";
		slideName[12] = "Parallel and Perpendicular Lines-Practice";
		slideName[13] = "Parallel and Perpendicular Lines-Practice";
		slideName[14] = "Quadrilateral and Rectangle";
		slideName[15] = "Quadrilateral and Rectangle-Practice";
		slideName[16] = "Triangle ";
		slideName[17] = "Two-Dimensional";
		slideName[18] = "Three-Dimensional";
		slideName[19] = "Two-Dimensional and Three-Dimensional-Practice";
		
		if (_global.splitStart == 0 || _global.splitEnd == 0) {
			intSlideNum = 0;
			for (i=2; i<_global.arrSection3_Details.length; i++) {
				intSlideNum++;
				mcName = _global.arrSection3_Details[i].substring(0, _global.arrSection3_Details[i].length-4);
				duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
				eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
				if (i == 2) {
					eval(mcName)._x = 16;
					eval(mcName)._y = 535;
				} else {
					slideSpace = false;
					for (j=2; j<_global.arrSSDSec3_Details.length; j++) {
						sx=slideName[intSlideNum-2]+"-Practice";
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2] or sx==slideName[intSlideNum-1]) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+15;
					} else {
						mcX = mcX+18;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide4 = true;
		} else {
			intSlideNum = _global.splitStart-2;
			for (i=_global.splitStart; i<=_global.splitEnd; i++) {
				trace(_global.splitStart);
				trace(_global.splitEnd);
				intSlideNum++;
				mcName = _global.arrSection3_Details[i].substring(0, _global.arrSection3_Details[i].length-4);
				duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
				eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
				if (i == _global.splitStart) {
					eval(mcName)._x = 16;
					eval(mcName)._y = 535;
				} else {
					slideSpace = false;
					for (j=2; j<_global.arrSSDSec3_Details.length; j++) {
						sx=slideName[intSlideNum-2]+"-Practice";
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2] or sx==slideName[intSlideNum-1]) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+18;
					} else {
						mcX = mcX+30;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide3 = true;
		}
	}
	//////    IN
	if (_global.sectionNumber == 4) {
		var slideSpace:Boolean;
		mcX = 16;
		slideName = new Array();
		slideName = new Array();
		slideName[0] = "Introduction";
		//1
		slideName[1] = "Identify Angles";
		slideName[2] = "Identify Angles";
		slideName[3] = "Identify Angles";
		slideName[4] = "Identify Angles-Practice";
		slideName[5] = "Draw Angles";
		slideName[6] = "Draw Angles-Practice";
		//2
		slideName[7] = "Measure Angles";
		slideName[8] = "Measure Angles";
		slideName[9] = "Measure Angles";
		slideName[10] = "Measure Angles-Practice";
		
		//3
		slideName[11] = "Parallel and Perpendicular Lines";
		//4
		slideName[12] = "Parallel and Perpendicular Lines-Practice";
		//5
		slideName[13] = "Draw Parallel Lines";
		slideName[14] = "Draw Parallel Lines";
		//6
		slideName[15] = "Draw Perpendicular Lines ";
		slideName[16] = "Draw Perpendicular Lines ";
		//7
		slideName[17] = "Identify Rectangles as Quadrilaterals";
		//
		slideName[18] = "Draw Rectangles";
		slideName[19] = "Draw Rectangles";
		//9
		slideName[20] = "Angle Sums in Quadrilaterals";
		//10
		slideName[21] = "Angle Sums in Quadrilaterals–Guided Practice";
		//11
		slideName[22] = "Angle Sums in Quadrilaterals-Practice";
		//12
		slideName[23] = "Draw Triangles";
		slideName[24] = "Draw Triangles";
		//13
		slideName[25] = "Angle Sums in Triangles";
		//14
		slideName[26] = "Angle Sums in Triangles-Practice";
		//15
		slideName[27] = "Two-Dimensional Drawings of Three-Dimensional Figures";
		//16
		slideName[28] = "Two-Dimensional Drawings of Three-Dimensional Figures-Practice";
		slideName[29] = "Two-Dimensional Drawings of Three-Dimensional Figures-Practice";
		
		if (_global.splitStart == 0 || _global.splitEnd == 0) {
			intSlideNum = 0;
			for (i=2; i<_global.arrSection4_Details.length; i++) {
				intSlideNum++;
				mcName = _global.arrSection4_Details[i].substring(0, _global.arrSection4_Details[i].length-4);
				duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
				eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
				if (i == 2) {
					eval(mcName)._x = 16;
					eval(mcName)._y = 535;
				} else {
					slideSpace = false;
					for (j=2; j<_global.arrSSDSec4_Details.length; j++) {
						sx=slideName[intSlideNum-2]+"-Practice";
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2] or sx==slideName[intSlideNum-1] or intSlideNum==19 or intSlideNum==20) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+15;
					} else {
						mcX = mcX+18;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide4 = true;
		} else {
			intSlideNum = _global.splitStart-2;
			for (i=_global.splitStart; i<=_global.splitEnd; i++) {
				trace(_global.splitStart);
				trace(_global.splitEnd);
				intSlideNum++;
				mcName = _global.arrSection4_Details[i].substring(0, _global.arrSection4_Details[i].length-4);
				duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
				eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
				if (i == _global.splitStart) {
					eval(mcName)._x = 16;
					eval(mcName)._y = 535;
				} else {
					slideSpace = false;
					for (j=2; j<_global.arrSSDSec4_Details.length; j++) {
						sx=slideName[intSlideNum-2]+"-Practice";
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2] or sx==slideName[intSlideNum-1] or intSlideNum==19 or intSlideNum==20) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+18;
					} else {
						mcX = mcX+30;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide4 = true;
		}
	}
	/////////   TI
	if (_global.sectionNumber == 5) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		slideName[0] = "Introduction";
		slideName[1] = "Question 1";
		slideName[2] = "Question  2";
		slideName[3] = "Question  3";
		slideName[4] = "Question  4";
		slideName[5] = "Question  5";
		slideName[6] = "Question  6";
		slideName[7] = "Question  7";
		slideName[8] = "Question  8";
		slideName[9] = "Question  9";
		slideName[10] ="Question  10";
		for (i=2; i<_global.arrSection5_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection5_Details[i].substring(0, _global.arrSection5_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec5_Details.length; j++) {
					if (_global.arrSSDSec5_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+16;
				} else {
					mcX = mcX+37;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide5 = true;
	}
	if (_global.sectionNumber == 6) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		slideName[0] = "Introduction";
		slideName[1] = "Game 1";
		for (i=2; i<_global.arrSection6_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection6_Details[i].substring(0, _global.arrSection6_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec6_Details.length; j++) {
					if (_global.arrSSDSec6_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide6 = true;
	}
	if (_global.sectionNumber == 7) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		slideName[0] = "Introduction";
		slideName[1] = "4 - Step Plan";
		slideName[2] = "4 - Step Plan";
		slideName[3] = "4 - Step Plan";
		slideName[4] = "4 - Step Plan";
		slideName[5] = "4 - Step Plan";
		slideName[6] = "Question 1";
		slideName[7] = "Question 2";
		
		for (i=2; i<_global.arrSection7_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection7_Details[i].substring(0, _global.arrSection7_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec7_Details.length; j++) {
					if (_global.arrSSDSec7_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide7 = true;
	}
	if (_global.sectionNumber == 8) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		slideName[0] = "Introduction";
		slideName[1] = "Page 1";
		slideName[2] = "Page 2";
		for (i=2; i<_global.arrSection8_Details.length; i++) {
			intSlideNum++;
			mcName = _global.arrSection8_Details[i].substring(0, _global.arrSection8_Details[i].length-4);
			duplicateMovieClip("_root.Slide_Source", mcName, intSlideNum);
			eval(mcName).SlideNum.SlideNum.text = slideName[intSlideNum-1];
			if (i == 2) {
				eval(mcName)._x = 16;
				eval(mcName)._y = 535;
			} else {
				slideSpace = false;
				for (j=2; j<_global.arrSSDSec8_Details.length; j++) {
					if (_global.arrSSDSec8_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+18;
				} else {
					mcX = mcX+30;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide8 = true;
	}
}
function doPlayPreviousMovie() {
	_global.Play = true;
	_global.Pause = false;
	_global.CompClick = "";
	_global.quizSection = false;
	_global.needMoreBackURL = "";
	_global.slideNumber--;
	_root.animation_mc.unloadMovie();
	_root.glossary.keyterms.mouse_down._x = _root.glossary.keyterms.x_pos;
	_root.glossary.keyterms.mouse_down._y = _root.glossary.keyterms.y_pos;
	_root.glossary._visible = false;
	_root.calculator._visible = false;
	_root.m_c._visible = false;
	_root.popup.gotoAndStop(1);
	_root.next_mc.gotoAndStop("inactive");
	_root.replay_mc.gotoAndStop("inactive");
	if (_global.sectionNumber == 1) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 1;
			_global.slideNumber = 2;
		}
		_global.playSwfFileName = _global.tempURL+"/IR/"+_global.arrSection1_Details[_global.slideNumber];
		_root.loadSWFMovie();
	}
	if (_global.sectionNumber == 2) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 1;
			_global.slideNumber = _global.arrSection1_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/IR/"+_global.arrSection1_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 3) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 2;
			_global.slideNumber = _global.arrSection2_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			if (_global.slideNumber>11) {
				_global.splitStart = 12;
				_global.splitEnd = 21;
				_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
				_root.doCreateSlide();
				_root.doPutBackAndFinished();
				_root.loadSWFMovie();
			} else {
				_global.splitStart = 2;
				_global.splitEnd = 11;
				_root.doCreateSlide();
				_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
				_root.doPutBackAndFinished();
				_root.loadSWFMovie();
			}
		}
		/*_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
							_root.doPutBackAndFinished();
							_root.loadSWFMovie();*/
		//}
	}
	if (_global.sectionNumber == 4) {
		/*if (_global.slideNumber+1 == 21) {
																					_global.splitStart = 2;
																					_global.splitEnd = 20;*/
		if (_global.slideNumber == 16) {
			_global.splitStart = 2;
			_global.splitEnd = 16;
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
		if (_global.slideNumber<2) {
			
			_global.sectionNumber = 3;
			_global.slideNumber = _global.arrSection3_Details.length-1;
			_global.splitStart = 12;
				_global.splitEnd = 21;
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 5) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 4;
			/*_global.splitStart = 21;
																														_global.splitEnd = 39;*/
			_global.splitStart = 16;
			_global.splitEnd = 31;
			_global.slideNumber = _global.arrSection4_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/TI/"+_global.arrSection5_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 6) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 5;
			_global.slideNumber = _global.arrSection5_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/TI/"+_global.arrSection5_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/GS/"+_global.arrSection6_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 7) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 6;
			_global.slideNumber = _global.arrSection6_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/GS/"+_global.arrSection6_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/TS/"+_global.arrSection7_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 8) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 7;
			_global.slideNumber = _global.arrSection7_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/TS/"+_global.arrSection7_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/FQ/"+_global.arrSection8_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
}
function doPlayNextMovie() {
	_global.Play = true;
	_global.Pause = false;
	_global.CompClick = "";
	_global.quizSection = false;
	_global.needMoreBackURL = "";
	_global.slideNumber++;
	_root.animation_mc.unloadMovie();
	_root.glossary.keyterms.mouse_down._x = _root.glossary.keyterms.x_pos;
	_root.glossary.keyterms.mouse_down._y = _root.glossary.keyterms.y_pos;
	_root.glossary._visible = false;
	_root.calculator._visible = false;
	_root.m_c._visible = false;
	_root.popup.gotoAndStop(1);
	_root.next.gotoAndStop("inactive");
	_root.replay.gotoAndStop("inactive");
	if (_global.sectionNumber == 1) {
		if (_global.slideNumber>_global.arrSection1_Details.length-1) {
			_global.sectionNumber = 2;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/IR/"+_global.arrSection1_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 2) {
		if (_global.slideNumber>_global.arrSection2_Details.length-1) {
			_global.sectionNumber = 3;
			_global.slideNumber = 2;
			_global.splitStart = 2;
			_global.splitEnd = 11;
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 3) {
		if (_global.slideNumber>_global.arrSection3_Details.length-1) {
			_global.sectionNumber = 4;
			_global.slideNumber = 2;
			_global.splitStart = 2;
			_global.splitEnd = 16;
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			if (_global.slideNumber>11) {
				_global.splitStart = 12;
				_global.splitEnd = 21;
				_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
				_root.doCreateSlide();
				_root.doPutBackAndFinished();
				_root.loadSWFMovie();
			} else {
				_global.splitStart = 2;
				_global.splitEnd = 11;
				_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
				_root.doPutBackAndFinished();
				_root.loadSWFMovie();
			}
		}
	}
	if (_global.sectionNumber == 4) {
		/*if (_global.slideNumber-1 == 20) {
																					_global.splitStart = 21;
																					_global.splitEnd = 39;*/
		if (_global.slideNumber > 16) {
			_global.splitStart = 17;
			_global.splitEnd = 31;
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
		if (_global.slideNumber>_global.arrSection4_Details.length-1) {
			_global.sectionNumber = 5;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/TI/"+_global.arrSection5_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 5) {
		if (_global.slideNumber>_global.arrSection5_Details.length-1) {
			_global.sectionNumber = 6;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/GS/"+_global.arrSection6_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/TI/"+_global.arrSection5_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 6) {
		if (_global.slideNumber>_global.arrSection6_Details.length-1) {
			_global.sectionNumber = 7;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/TS/"+_global.arrSection7_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/GS/"+_global.arrSection6_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 7) {
		if (_global.slideNumber>_global.arrSection7_Details.length-1) {
			_global.sectionNumber = 8;
			_global.slideNumber = 2;
			_global.playSwfFileName = _global.tempURL+"/FQ/"+_global.arrSection8_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/TS/"+_global.arrSection7_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 8) {
		if (_global.slideNumber>_global.arrSection8_Details.length-1) {
			_global.sectionNumber = 8;
			_global.slideNumber = _global.arrSection8_Details.length-1;
		}
		_global.playSwfFileName = _global.tempURL+"/FQ/"+_global.arrSection8_Details[_global.slideNumber];
		_root.doPutBackAndFinished();
		_root.loadSWFMovie();
	}
}
function doCheckSpanishAudio() {
	_root.dtfSPANISH.text = "ON";
	if (_root.dtfSPANISH.text == "ON") {
		if (_global.spanSound != true) {
			if (_global.sectionNumber == 2 || _global.sectionNumber == 3 || _global.sectionNumber == 4 || _global.sectionNumber == 5 || _global.sectionNumber == 6 || _global.sectionNumber == 7) {
				if (_global.playSwfFileName != _global.tempURL+"/RW/L13RW01.swf" && _global.playSwfFileName != _global.tempURL+"/VB/L13VB01.swf" && _global.playSwfFileName != _global.tempURL+"/IN/L13IN01.swf" && _global.playSwfFileName != _global.tempURL+"/GS/L13GS01.swf" && _global.playSwfFileName != _global.tempURL+"/TI/L13TI01.swf" && _global.playSwfFileName != _global.tempURL+"/TS/L13TS01.swf") {
					_root.SA._visible = true;
					_root.EA._visible = true;
					_root.SA_PLAY._visible = false;
					_root.SA_PAUSE._visible = false;
					_root.SA._alpha = 100;
					_root.EA._alpha = 100;
				} else {
					_root.SA._visible = false;
					_root.EA._visible = false;
					_root.SA_PLAY._visible = false;
					_root.SA_PAUSE._visible = false;
					_root.SA._alpha = 0;
					_root.EA._alpha = 0;
				}
			} else {
				_root.SA._visible = false;
				_root.EA._visible = false;
				_root.SA_PLAY._visible = false;
				_root.SA_PAUSE._visible = false;
				_root.SA._alpha = 0;
				_root.EA._alpha = 0;
			}
		}
	} else {
		_root.SA._visible = false;
		_root.EA._visible = false;
		_root.SA_PLAY._visible = false;
		_root.SA_PAUSE._visible = false;
		_root.SA._alpha = 0;
		_root.EA._alpha = 0;
	}
}
