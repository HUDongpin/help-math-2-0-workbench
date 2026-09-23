//Vars Starts
//LessonDetails = "[CourseDetails]~CourseName,Algebra~LessonName,ABC to XYZ~TotalSection,8[Details_Split][Section1Details]~IR~L7RW01.swf[Details_Split][Section2Details]~RW~L7RW02.swf~L7RW03.swf~L7RW04.swf~L7RW05.swf[Details_Split][Section3Details]~VB~L7VB01.swf~L7VB02.swf~L7VB03.swf~L7VB04.swf~L7VB05.swf~L7VB06.swf~L7VB07.swf~L7VB08.swf~L7VB09.swf~L7VB10.swf~L7VB11.swf~L7VB12.swf~L7VB13.swf[Details_Split][Section4Details]~IN~L7IN01.swf~L7IN02.swf~L7IN03.swf~L7IN04.swf~L7IN05.swf~L7IN06.swf~L7IN07.swf~L7IN08.swf~L7IN09.swf~L7IN10.swf~L7IN11.swf~L7IN12.swf~L7IN13.swf~L7IN14.swf~L7IN15.swf[Details_Split][Section5Details]~TI~L7TI01.swf~L7TI02.swf~L7TI03.swf~L7TI04.swf~L7TI05.swf~L7TI06.swf~L7TI07.swf[Details_Split][Section6Details]~GS~L7GS01.swf~L7GS02.swf[Details_Split][Section7Details]~TS~L7TS01.swf~L7TS02.swf~L7TS03.swf~L7TS04.swf~L7TS05.swf~L7TS06.swf~L7TS07.swf~L7TS08.swf[Details_Split][Section8Details]~FQ~L7FQ01.swf~L7FQ02.swf";
LessonDetails = "[CourseDetails]~CourseName,Algebra~LessonName,ABC to XYZ~TotalSection,8[Details_Split][Section1Details]~IR~L7RW01.swf[Details_Split][Section2Details]~RW~L7RW02.swf~L7RW03.swf~L7RW04.swf~L7RW05.swf[Details_Split][Section3Details]~VB~L7VB01.swf~L7VB02.swf~L7VB03.swf~L7VB04.swf~L7VB05.swf~L7VB06.swf~L7VB07.swf~L7VB08.swf~L7VB09.swf~L7VB10.swf~L7VB11.swf~L7VB12.swf~L7VB13.swf[Details_Split][Section4Details]~IN~L7IN01.swf~L7IN02.swf~L7IN03.swf~L7IN04.swf~L7IN05.swf~L7IN06.swf~L7IN07.swf~L7IN08.swf~L7IN09.swf~L7IN10.swf~L7IN11.swf~L7IN12.swf~L7IN13.swf~L7IN14.swf~L7IN15.swf[Details_Split][Section5Details]~TI~L7TI01.swf~L7TI02.swf~L7TI03.swf~L7TI04.swf~L7TI05.swf~L7TI06.swf~L7TI07.swf[Details_Split][Section6Details]~GS~L7GS01.swf~L7GS02.swf[Details_Split][Section7Details]~TS~L7TS01.swf~L7TS02.swf~L7TS03.swf~L7TS04.swf~L7TS05.swf~L7TS06.swf~L7TS07.swf~L7TS08.swf[Details_Split][Section8Details]~FQ~L7FQ01.swf~L7FQ02.swf~L7FQ03.swf";
SlideSpaceDetails = "[Section1Details]~IR[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~3~5~11[Details_Split][Section4Details]~IN~4~6~8~10~14~15[Details_Split][Section5Details]~TI[Details_Split][Section6Details]~GS[Details_Split][Section7Details]~TS[Details_Split][Section8Details]~FQ";
RandomAudioDetails = "[Section1Details]~IR~L7RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L7VB01.swf[Details_Split][Section4Details]~IN~L7IN01.swf[Details_Split][Section5Details]~TI~L7TI01.swf[Details_Split][Section6Details]~GS~L7GS01.swf[Details_Split][Section7Details]~TS";
BGTextDetails = "[Section1Details]~IR~L7RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L7VB01.swf[Details_Split][Section4Details]~IN~L7IN01.swf[Details_Split][Section5Details]~TI~L7TI01.swf[Details_Split][Section6Details]~GS~L7GS01.swf[Details_Split][Section7Details]~TS~L7TS01.swf";
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
					mcX = mcX+18;
				} else {
					mcX = mcX+40;
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
				slideName[4] = "Page 4";
				
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
			if (_global.sectionNumber == 3) {
				var slideSpace:Boolean;
				mcX = 16;
				intSlideNum = 0;
				slideName = new Array();

				slideName[0] = "Introduction";

				slideName[1] = "To Factor/Factoring";			
				slideName[2] = "To Factor/Factoring";

				slideName[3] = "Factors and Product";		
				slideName[4] = "Factor/Product Practice";	

				slideName[5] = "Prime Number";	

				slideName[6] = "Composite Number";

				slideName[7] = "Prime/Composite Practice";

				slideName[8] = "Hundreds Chart";

				slideName[9] = "Array";				
				slideName[10] = "Array Practice";

				slideName[11] = "Factor Tree";

				slideName[12] = "Prime Factorization";	
		
		
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
						mcX = mcX+18;
					} else {
						mcX = mcX+40;
					}
					eval(mcName)._x = mcX;
				}
				eval(mcName).SlideNum._visible = false;
			}
			_global.createSlide3 = true;			
}
		
		if (_global.sectionNumber == 4) {
			var slideSpace:Boolean;
			mcX = 16;
			intSlideNum = 0;
			slideName = new Array();

			slideName[0] = "Introduction";

			slideName[1] = "Factoring";

			slideName[2] = "Find Factors Using Arrays";
			slideName[3] = "Find Factors Using Arrays Practice";//4

			slideName[4] = "Find Factors Using a Hundreds Chart";
			slideName[5] = "Find Factors Using a Hundreds Chart Practice";//6		

			slideName[6] = "Composite Numbers";
			slideName[7] = "Composite Numbers";//8

			slideName[8] = "Prime Numbers";						
			slideName[9] = "Prime Numbers";//10

			slideName[10] = "One: Prime or Composite?";

			slideName[11] = "Two: An Even Prime Number";	

			slideName[12] = "Prime Factorization";					
			slideName[13] = "Prime Factorization Practice";	//14					
			slideName[14] = "Prime Factorization Practice";	//15

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
						mcX = mcX+18;
					} else {
						mcX = mcX+40;
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
					mcX = mcX+18;
				} else {
					mcX = mcX+40;
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
					mcX = mcX+18;
				} else {
					mcX = mcX+40;
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
					mcX = mcX+40;
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
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 4) {
		if (_global.slideNumber<2) {
			_global.sectionNumber = 3;
			_global.slideNumber = _global.arrSection3_Details.length-1;				
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
	//_root.dtfSPANISH.text = "ON";
	if (_root.dtfSPANISH.text == "ON") {
		if (_global.spanSound != true) {
			if (_global.sectionNumber == 2 || _global.sectionNumber == 3 || _global.sectionNumber == 4 || _global.sectionNumber == 5 || _global.sectionNumber == 6 || _global.sectionNumber == 7) {
				if (_global.playSwfFileName != _global.tempURL+"/RW/L7RW01.swf" && _global.playSwfFileName != _global.tempURL+"/VB/L7VB01.swf" && _global.playSwfFileName != _global.tempURL+"/IN/L7IN01.swf" && _global.playSwfFileName != _global.tempURL+"/GS/L7GS01.swf" && _global.playSwfFileName != _global.tempURL+"/TI/L7TI01.swf" && _global.playSwfFileName != _global.tempURL+"/TS/L7TS01.swf") {
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