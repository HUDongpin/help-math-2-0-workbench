//Vars Starts
LessonDetails = "[CourseDetails]~CourseName,Counting on Numbers~LessonName,Counting on Numbers~TotalSection,8[Details_Split][Section1Details]~IR~L3RW01.swf[Details_Split][Section2Details]~RW~L3RW02.swf~L3RW03.swf~L3RW04.swf[Details_Split][Section3Details]~VB~L3VB01.swf~L3VB02.swf~L3VB03.swf~L3VB04.swf~L3VB05.swf~L3VB06.swf~L3VB07.swf~L3VB08.swf~L3VB09.swf~L3VB10.swf~L3VB11.swf~L3VB12.swf~L3VB13.swf~L3VB14.swf~L3VB15.swf[Details_Split][Section4Details]~IN~L3IN01.swf~L3IN02.swf~L3IN03.swf~L3IN04.swf~L3IN05.swf~L3IN06.swf~L3IN07.swf~L3IN08.swf~L3IN09.swf~L3IN10.swf~L3IN11.swf~L3IN12.swf~L3IN13.swf~L3IN14.swf~L3IN15.swf~L3IN16.swf~L3IN17.swf~L3IN18.swf~L3IN19.swf~L3IN20.swf~L3IN21.swf~L3IN22.swf~L3IN23.swf~L3IN24.swf~L3IN25.swf~L3IN26.swf~L3IN27.swf~L3IN28.swf~L3IN29.swf[Details_Split][Section5Details]~TI~L3TI01.swf~L3TI02.swf~L3TI03.swf~L3TI04.swf~L3TI05.swf~L3TI06.swf~L3TI07.swf~L3TI08.swf~L3TI09.swf[Details_Split][Section6Details]~GS~L3GS01.swf~L3GS02.swf[Details_Split][Section7Details]~TS~L3TS01.swf~L3TS02.swf~L3TS03.swf~L3TS04.swf~L3TS05.swf~L3TS06.swf~L3TS07.swf~L3TS08.swf[Details_Split][Section8Details]~FQ~L3FQ01.swf~L3FQ02.swf~L3FQ03.swf";
SlideSpaceDetails = "[Section1Details]~IR[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~3~4~13~15[Details_Split][Section4Details]~IN~3~4~9~10~12~13~14~15~17~18~20~21~25~26~28~29[Details_Split][Section5Details]~TI[Details_Split][Section6Details]~GS[Details_Split][Section7Details]~TS[Details_Split][Section8Details]~FQ";
RandomAudioDetails = "[Section1Details]~IR~L3RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L3VB01.swf[Details_Split][Section4Details]~IN~L3IN01.swf[Details_Split][Section5Details]~TI~L3TI01.swf[Details_Split][Section6Details]~GS~L3GS01.swf[Details_Split][Section7Details]~TS";
BGTextDetails = "[Section1Details]~IR~L3RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L3VB01.swf[Details_Split][Section4Details]~IN~L3IN01.swf[Details_Split][Section5Details]~TI~L3TI01.swf[Details_Split][Section6Details]~GS~L3GS01.swf[Details_Split][Section7Details]~TS~L3TS01.swf";
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
	if (_global.sectionNumber == 3) {
		var slideSpace:Boolean;
		mcX = 16;
		intSlideNum = 0;
		slideName = new Array();
		
		slideName[0] = "Introduction";
		
		slideName[1] = "Exponent, Base, and Power";	
		slideName[2] = "Exponent, Base, and Power";
		slideName[3] = "Exponent, Base, and Power";
		
		slideName[4] = "Squared";	
		
		slideName[5] = "Factor, Factor Pair";	
		
		slideName[6] = "Factor Pair Practice";
				
		slideName[7] = "Prime Numbers";
		
		slideName[8] = "Composite Numbers";
		
		slideName[9] = "Prime Number/Composite Number";
		
		slideName[10] = "Prime Factor";	
		
		slideName[11] = "Prime Factorization and Factor Trees";
		slideName[12] = "Prime Factorization and Factor Trees";	
		
		slideName[13] = "Prime Factorization with Exponents";		
		slideName[14] = "Prime Factorization with Exponents Practice";
		
		
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
					mcX = mcX+30;
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
		slideName = new Array();
		slideName[0] = "Introduction";

		slideName[1] = "Understanding Exponents";				
		slideName[2] = "Understanding Exponents";
		slideName[3] = "Understanding Exponents";

		slideName[4] = "Exponents Practice";
		
		slideName[5] = "Understanding Exponents - Squared Numbers";		

		slideName[6] = "Understanding Exponents Practice";
		
		slideName[7] = "Computing Exponents";
		slideName[8] = "Computing Exponents";	
		slideName[9] = "Computing Exponents Practice";
		
		slideName[10] = "Factors of Whole Numbers";
		slideName[11] = "Factors of Whole Numbers";
		slideName[12] = "Factors of Whole Numbers Practice";
		slideName[13] = "Factors of Whole Numbers Practice";
		slideName[14] = "Factors of Whole Numbers Practice";
		
		slideName[15] = "Prime of Whole Numbers";
		slideName[16] = "Prime of Whole Numbers";
		slideName[17] = "Prime of Whole Numbers - Practice";
		
		slideName[18] = "Prime  Factorizations-Composite Numbers";
		slideName[19] = "Prime-Factorizations-Composite Numbers";
		slideName[20] = "Prime-Factorizations-Composite Numbers";
		
		slideName[21] = "Prime-Factorizations-Prime Factorization";
		
		slideName[22] = "Prime-Factorizations-Factor Trees";

		slideName[23] = "Prime-Factorizations";
		slideName[24] = "Prime-Factorizations";
		slideName[25] = "Prime Factorization Practice";
		
		slideName[26] = "Prime Factorizations Using Exponents";
		slideName[27] = "Prime Factorizations Using Exponents";
		slideName[28] = "Prime Factorizations Using Exponents Practice";
		
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
						if (_global.arrSSDSec4_Details[j] == intSlideNum) {
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
		} else {
			intSlideNum = _global.splitStart-2;
			for (i=_global.splitStart; i<=_global.splitEnd; i++) {
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
						if (_global.arrSSDSec4_Details[j] == intSlideNum) {
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
			_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
	}
	if (_global.sectionNumber == 4) {
		/*if (_global.slideNumber+1 == 21) {
			_global.splitStart = 2;
			_global.splitEnd = 20;*/
			
			if (_global.slideNumber+1 == 17) {
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
			
			_global.splitStart = 17;
			_global.splitEnd = 30;
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
			/*_global.splitStart = 2;
			_global.splitEnd = 20;*/
			
			_global.splitStart = 2;
			_global.splitEnd = 16;
			
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
		/*if (_global.slideNumber-1 == 20) {
			_global.splitStart = 21;
			_global.splitEnd = 39;*/
			
			if (_global.slideNumber-1 == 16) {
			_global.splitStart = 17;
			_global.splitEnd = 30;
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
				if (_global.playSwfFileName != _global.tempURL+"/RW/L3RW01.swf" && _global.playSwfFileName != _global.tempURL+"/VB/L3VB01.swf" && _global.playSwfFileName != _global.tempURL+"/IN/L3IN01.swf" && _global.playSwfFileName != _global.tempURL+"/GS/L3GS01.swf" && _global.playSwfFileName != _global.tempURL+"/TI/L3TI01.swf" && _global.playSwfFileName != _global.tempURL+"/TS/L3TS01.swf") {
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