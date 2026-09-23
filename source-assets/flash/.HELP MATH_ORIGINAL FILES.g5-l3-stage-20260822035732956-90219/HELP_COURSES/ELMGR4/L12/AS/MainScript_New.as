//Vars Starts
LessonDetails = "[CourseDetails]~CourseName,Algebra~LessonName,ABC to XYZ~TotalSection,8[Details_Split][Section1Details]~IR~L12RW01.swf[Details_Split][Section2Details]~RW~L12RW02.swf~L12RW03.swf~L12RW04.swf[Details_Split][Section3Details]~VB~L12VB01.swf~L12VB02.swf~L12VB03.swf~L12VB04.swf~L12VB05.swf~L12VB06.swf~L12VB07.swf~L12VB08.swf~L12VB09.swf~L12VB10.swf~L12VB11.swf~L12VB12.swf~L12VB13.swf~L12VB14.swf~L12VB15.swf~L12VB16.swf~L12VB17.swf~L12VB18.swf~L12VB19.swf~L12VB20.swf~L12VB21.swf~L12VB22.swf~L12VB23.swf~L12VB24.swf~L12VB25.swf~L12VB26.swf~L12VB27.swf~L12VB28.swf~L12VB29.swf~L12VB30.swf~L12VB31.swf~L12VB32.swf~L12VB33.swf~L12VB34.swf~L12VB35.swf~L12VB36.swf[Details_Split][Section4Details]~IN~L12IN01.swf~L12IN02.swf~L12IN03.swf~L12IN04.swf~L12IN05.swf~L12IN06.swf~L12IN07.swf~L12IN08.swf~L12IN09.swf~L12IN10.swf~L12IN11.swf~L12IN12.swf~L12IN13.swf~L12IN14.swf~L12IN15.swf~L12IN16.swf~L12IN17.swf~L12IN18.swf~L12IN19.swf[Details_Split][Section5Details]~TI~L12TI01.swf~L12TI02.swf~L12TI03.swf~L12TI04.swf~L12TI05.swf~L12TI06.swf~L12TI07.swf~L12TI08.swf~L12TI09.swf~L12TI10.swf[Details_Split][Section6Details]~GS~L12GS01.swf~L12GS02.swf[Details_Split][Section7Details]~TS~L12TS01.swf~L12TS02.swf~L12TS03.swf~L12TS04.swf~L12TS05.swf~L12TS06.swf~L12TS07.swf~L12TS08.swf[Details_Split][Section8Details]~FQ~L12FQ01.swf~L12FQ02.swf~L12FQ03.swf";
SlideSpaceDetails = "[Section1Details]~IR[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~7~31[Details_Split][Section4Details]~IN~4[Details_Split][Section5Details]~TI[Details_Split][Section6Details]~GS[Details_Split][Section7Details]~TS[Details_Split][Section8Details]~FQ";
RandomAudioDetails = "[Section1Details]~IR~L12RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L12VB01.swf[Details_Split][Section4Details]~IN~L12IN01.swf[Details_Split][Section5Details]~TI~L12TI01.swf[Details_Split][Section6Details]~GS~L12GS01.swf[Details_Split][Section7Details]~TS";
BGTextDetails = "[Section1Details]~IR~L12RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L12VB01.swf[Details_Split][Section4Details]~IN~L12IN01.swf[Details_Split][Section5Details]~TI~L12TI01.swf[Details_Split][Section6Details]~GS~L12GS01.swf[Details_Split][Section7Details]~TS~L12TS01.swf";
//Vars End

function doCreateSlide() {
	for (i=2; i<_global.arrSection1_Details.length; i++) {
		mcName = _global.arrSection1_Details[i].substring(0, _global.arrSection1_Details[i].length-4);
		removeMovieClip(mcName);
	}
	for (i=2; i<_global.arrSection2_Details.length; i++) {
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
					mcX = mcX+16;
				} else {
					mcX = mcX+25;
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
						trace(_global.arrSSDSec2_Details[j] );
						trace(intSlideNum);
						if (_global.arrSSDSec2_Details[j] == intSlideNum) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+16;
					} else {
						mcX = mcX+25;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide2 = true;
	}
	if (_global.sectionNumber == 3) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;

		slideName = new Array();
		slideName[0] = "Introduction";
		
		slideName[1] = "Geometry";	
		
		slideName[2] = "Angle";
		
		slideName[3] = "Right Angle";
		
		slideName[4] = "Acute Angle";	
		
		slideName[5] = "Obtuse Angle";	
		slideName[6] = "Obtuse Angle";
		
		slideName[7] = "Angle Practice";
		
		slideName[8] = "Line";
		
		slideName[9] = "Parallel Lines";		
		
		slideName[10] = "Perpendicular Lines";
		
		slideName[11] = "Line Practice";
		
		slideName[12] = "Circle";
		
		slideName[13] = "Radius";
		
		slideName[14] = "Diameter";
		
		slideName[15] = "Circle Practice";
		
		slideName[16] = "Polygon";
		
		slideName[17] = "Triangle";
		
		slideName[18] = "Equilateral Triangle";
		
		slideName[19] = "Isosceles Triangle";
		
		slideName[20] = "Scalene Triangle";
		
		slideName[21] = "Triangle Practice";
		
		slideName[22] = "Quadrilateral";
		
		slideName[23] = "Types of Quadrilaterals";
		
		slideName[24] = "Quadrilateral Practice";
		
		slideName[25] = "Solid Figure/Three-dimensional";
		
		slideName[26] = "Types of Solid Figures";
		
		slideName[27] = "Face";
		
		slideName[28] = "Solid Figure Practice";
		
		slideName[29] = "Net";
		slideName[30] = "Net";
		
		slideName[31] = "Congruent Figures";
		
		slideName[32] = "Congruent Figures Practice";
		
		slideName[33] = "Bilateral Symmetry";
		
		slideName[34] = "Rotational Symmetry";
		
		slideName[35] = "Symmetry Practice";

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
						if (_global.arrSSDSec3_Details[j] == intSlideNum) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+16;
					} else {
						mcX = mcX+25;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide3 = true;
		} else {
			intSlideNum = _global.splitStart-2;
			for (i=_global.splitStart; i<=_global.splitEnd; i++) {
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
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2]) {
							slideSpace = true;
						}
					}
					if (slideSpace) {
						mcX = mcX+16;
					} else {
						mcX = mcX+25;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide3 = true;
		}			
	}
		
	if (_global.sectionNumber == 4) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();

		slideName[0] = "Introduction";
		
		slideName[1] = "Types of Angles";
		
		slideName[2] = "Measure and Classify Angles";
		
		slideName[3] = "Parallel and Perpendicular Lines";
		slideName[4] = "Parallel and Perpendicular Lines";
		
		slideName[5] = "Parallel and Perpendicular Line Practice";						
		
		slideName[6] = "Radius and Diameter";
		
		slideName[7] = "Radius and Diameter Practice";					
		
		slideName[8] = "Types of Triangles";						
		
		slideName[9] = "Triangle Sort";
		
		slideName[10] = "Types of Quadrilaterals";
		
		slideName[11] = "Quadrilateral Practice";	
		
		slideName[12] = "Solid Figures";	
		
		slideName[13] = "Solid Figures Practice";	
		
		slideName[14] = "Nets for Solid Figures";	
		
		slideName[15] = "Net Practice";	
		
		slideName[16] = "Congruent Figures";	
		
		slideName[17] = "Congruent Figures Practice";	
		
		slideName[18] = "Line and Rotational Symmetry";	
		
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
					if (_global.arrSSDSec4_Details[j] == intSlideNum) {
						slideSpace = true;
					}
				}
				if (slideSpace) {
					mcX = mcX+16;
				} else {
					mcX = mcX+25;
				}
				eval(mcName)._x = mcX;
			}
			eval(mcName).SlideNum._visible = false;
		}
		_global.createSlide4 = true;
	}
	if (_global.sectionNumber == 5) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
				slideName[0] = "Introduction";
				slideName[1] = "Question 1";
				slideName[2] = "Question 2";
				slideName[3] = "Question 3";
				slideName[4] = "Question 4";
				slideName[5] = "Question 5";
				slideName[6] = "Question 6";
				slideName[7] = "Question 7";
				slideName[8] = "Question 8";
				slideName[9] = "Question 9";

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
					mcX = mcX+25;
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
		slideName[2] = "Game 2";
		intSlideNum = 0;
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
					mcX = mcX+16;
				} else {
					mcX = mcX+25;
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
		
		
		intSlideNum = 0;
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
					mcX = mcX+16;
				} else {
					mcX = mcX+25;
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
					mcX = mcX+16;
				} else {
					mcX = mcX+25;
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
		if (_global.slideNumber+1 == 19) {
			_global.splitStart = 2;
			_global.splitEnd = 18;		

			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
		if (_global.slideNumber<2) {
			_global.sectionNumber = 2;
			_global.slideNumber = _global.arrSection2_Details.length-1;
			_global.playSwfFileName = _global.tempURL+"/RW/"+_global.arrSection2_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 4) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 3;
			_global.slideNumber = _global.arrSection3_Details.length-1;

			_global.splitStart = 18;
			_global.splitEnd = 37;

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
			_global.splitEnd = 18;			

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
		if (_global.slideNumber-1 == 18) {
			_global.splitStart = 19;
			_global.splitEnd = 37;

			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}	
		if (_global.slideNumber>_global.arrSection3_Details.length-1) {
			_global.sectionNumber = 4;
			_global.slideNumber = 2;		
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 4) {		
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
	_root.dtfSPANISH.text = "ON"
	if (_root.dtfSPANISH.text == "ON") {
		if (_global.spanSound != true) {
			if (_global.sectionNumber == 2 || _global.sectionNumber == 3 || _global.sectionNumber == 4 || _global.sectionNumber == 5 || _global.sectionNumber == 6 || _global.sectionNumber == 7) {
				if (_global.playSwfFileName != _global.tempURL+"/RW/L12RW01.swf" && _global.playSwfFileName != _global.tempURL+"/VB/L12VB01.swf" && _global.playSwfFileName != _global.tempURL+"/IN/L12IN01.swf" && _global.playSwfFileName != _global.tempURL+"/GS/L12GS01.swf" && _global.playSwfFileName != _global.tempURL+"/TI/L12TI01.swf" && _global.playSwfFileName != _global.tempURL+"/TS/L12TS01.swf") {
					_root.SA._visible = true;
					_root.EA._visible = true;

					_root.SA_PLAY._visible=false;
					_root.SA_PAUSE._visible=false;
					
					_root.SA._alpha = 100;
					_root.EA._alpha = 100;
				} else {
					_root.SA._visible = false;
					_root.EA._visible = false;
					
					_root.SA_PLAY._visible=false;
					_root.SA_PAUSE._visible=false;
					
					_root.SA._alpha = 0;
					_root.EA._alpha = 0;
				}
			} else {
				_root.SA._visible = false;
				_root.EA._visible = false;
				
				_root.SA_PLAY._visible=false;
				_root.SA_PAUSE._visible=false;
					
				_root.SA._alpha = 0;
				_root.EA._alpha = 0;
			}
		}
	} else {
		_root.SA._visible = false;
		_root.EA._visible = false;
		
		_root.SA_PLAY._visible=false;
		_root.SA_PAUSE._visible=false;
					
		_root.SA._alpha = 0;
		_root.EA._alpha = 0;
	}
}