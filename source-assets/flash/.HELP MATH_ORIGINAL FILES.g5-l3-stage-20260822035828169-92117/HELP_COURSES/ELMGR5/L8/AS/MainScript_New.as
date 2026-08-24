//Vars Starts
LessonDetails = "[CourseDetails]~CourseName,Counting on Numbers~LessonName,Counting on Numbers~TotalSection,8[Details_Split][Section1Details]~IR~L8RW01.swf[Details_Split][Section2Details]~RW~L8RW02.swf~L8RW03.swf~L8RW04.swf[Details_Split][Section3Details]~VB~L8VB01.swf~L8VB02.swf~L8VB03.swf~L8VB04.swf~L8VB05.swf~L8VB06.swf~L8VB07.swf~L8VB08.swf~L8VB09.swf~L8VB10.swf~L8VB11.swf~L8VB12.swf~L8VB13.swf~L8VB14.swf~L8VB15.swf~L8VB16.swf~L8VB17.swf~L8VB18.swf~L8VB19.swf~L8VB20.swf~L8VB21.swf~L8VB22.swf~L8VB23.swf~L8VB24.swf~L8VB25.swf[Details_Split][Section4Details]~IN~L8IN01.swf~L8IN02.swf~L8IN03.swf~L8IN04.swf~L8IN05.swf~L8IN06.swf~L8IN07.swf~L8IN08.swf~L8IN09.swf~L8IN10.swf~L8IN11.swf~L8IN12.swf~L8IN13.swf~L8IN14.swf~L8IN15.swf~L8IN16.swf~L8IN17.swf~L8IN18.swf~L8IN19.swf~L8IN20.swf~L8IN21.swf~L8IN22.swf~L8IN23.swf~L8IN24.swf~L8IN25.swf~L8IN26.swf~L8IN27.swf[Details_Split][Section5Details]~TI~L8TI01.swf~L8TI02.swf~L8TI03.swf~L8TI04.swf~L8TI05.swf~L8TI06.swf~L8TI07.swf[Details_Split][Section6Details]~GS~L8GS01.swf~L8GS02.swf[Details_Split][Section7Details]~TS~L8TS01.swf~L8TS02.swf~L8TS03.swf~L8TS04.swf~L8TS05.swf~L8TS06.swf~L8TS07.swf~L8TS08.swf~L8TS09.swf[Details_Split][Section8Details]~FQ~L8FQ01.swf~L8FQ02.swf~L8FQ03.swf";
SlideSpaceDetails = "[Section1Details]~IR[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~3~6~10~12~13[Details_Split][Section4Details]~IN~4~5~7~8~9~10~13~15~16~17~18~19[Details_Split][Section5Details]~TI[Details_Split][Section6Details]~GS[Details_Split][Section7Details]~TS[Details_Split][Section8Details]~FQ";
RandomAudioDetails = "[Section1Details]~IR~L8RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L8VB01.swf[Details_Split][Section4Details]~IN~L8IN01.swf[Details_Split][Section5Details]~TI~L8TI01.swf[Details_Split][Section6Details]~GS~L8GS01.swf[Details_Split][Section7Details]~TS";
BGTextDetails = "[Section1Details]~IR~L8RW01.swf[Details_Split][Section2Details]~RW[Details_Split][Section3Details]~VB~L8VB01.swf[Details_Split][Section4Details]~IN~L8IN01.swf[Details_Split][Section5Details]~TI~L8TI01.swf[Details_Split][Section6Details]~GS~L8GS01.swf[Details_Split][Section7Details]~TS~L8TS01.swf";
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
		slideName[1] = "Fraction ";
		slideName[2] = "Numerator and Denominator";
		slideName[3] = "Numerator and Denominator";
		slideName[4] = "Numerator Practice";
		slideName[5] = "Denominator Practice";
		slideName[6] = "Like Fractions";
		slideName[7] = "Like Fractions Practice";
		slideName[8] = "Improper Fraction";
		slideName[9] = "Improper Fraction Practice";
		slideName[10] = "Mixed Number";
		slideName[11] = "Equivalent ";
		slideName[12] = "Simplify/Simplest Form";
		slideName[13] = "Simplify/Simplest Form Practice";
		slideName[14] = "Simplest Form Practice";
		slideName[15] = "Greatest Common Factor";
		slideName[16] = "Greatest Common Factor Practice";
		slideName[17] = "Greatest Common Factor Practice";
		slideName[18] = "Unlike Fractions";
		slideName[19] = "Unlike Fractions Practice";
		slideName[20] = "Least Common Multiple";
		slideName[21] = "Least Common Multiple Practice";
		slideName[22] = "Least Common Multiple Practice";
		slideName[23] = "Least Common Denominator";
		slideName[24] = "Least Common Denominator";
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
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2]) {
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
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2]) {
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
		slideName[1] = "Add Like Fractions";
		//2
		slideName[2] = "Add like Fractions Practice";
		//3
		slideName[3] = "Sums That Are Improper Fractions";
		//4
		slideName[4] = "Improper Fractions Practice";
		//5
		slideName[5] = "Subtract Like Fractions";
		//6
		slideName[6] = "Simplest Form";
		//7
		slideName[7] = "Simplest Form-Practice";
		//8
		slideName[8] = "Simplest Form-Practice";
		//9
		slideName[9] = "Add and Subtract Like Fractions Practice";
		//10
		slideName[10] = "Add and Subtract Like Fractions Practice";
		//11
		slideName[11] = "Add Mixed Numbers with Like Fractions";
		//12
		slideName[12] = "Add Mixed Numbers With Like Fractions Practice";
		//13
		slideName[13] = "Subtract Mixed Numbers With Like Fractions";
		//14
		slideName[14] = "Subtract Mixed Numbers With Like Fractions Rename the Whole Number";
		//15
		slideName[15] = "Subtract Mixed Numbers with Like Fractions Practice";
		//16
		slideName[16] = "Add Unlike Fractions ";
		//17
		slideName[17] = "Subtract Unlike Fractions";
		//18
		slideName[18] = "Add and Subtract  Unlike Fractions Practice";
		//19
		slideName[19] = "Add Mixed Numbers with Unlike Denominators";
		//20
		slideName[20] = "Add Mixed Numbers with Unlike Denominators Guided Practice";
		//20
		slideName[21] = "Subtract Mixed Numbers with Unlike Denominators";
		//20
		slideName[22] = "Subtract Mixed Numbers with Unlike Denominators";
		//20
		slideName[23] = "Add and Subtract Mixed Numbers with Unlike Denominators-Practice";
		//20
		slideName[24] = "Subtract a Fraction or Mixed Number from a Whole Number";
		//20
		slideName[25] = "Solve Problems with Fractions and Mixed Numbers";
		//20
		slideName[26] = "Solve Problems with Fractions and Mixed Numbers";
		//20
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
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2]) {
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
						if (slideName[intSlideNum-1] == slideName[intSlideNum-2]) {
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
		slideName[8] = "Question 3";
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
			if (_global.slideNumber-1>13) {
				_global.splitStart = 14;
				_global.splitEnd = 26;
				_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
				_root.doCreateSlide();
				_root.doPutBackAndFinished();
				_root.loadSWFMovie();
			} else {
				_global.splitStart = 2;
				_global.splitEnd = 13;
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
		if (_global.slideNumber == 14) {
			_global.splitStart = 2;
			_global.splitEnd = 14;
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		}
		if (_global.slideNumber<2) {
			
			_global.sectionNumber = 3;
			_global.slideNumber = _global.arrSection3_Details.length-1;
			_global.splitStart = 14;
				_global.splitEnd = 26;
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
			_global.splitStart = 15;
			_global.splitEnd = 28;
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
			_global.splitEnd = 13;
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
			_global.splitEnd = 14;
			_global.playSwfFileName = _global.tempURL+"/IN/"+_global.arrSection4_Details[_global.slideNumber];
			_root.doCreateSlide();
			_root.doPutBackAndFinished();
			_root.loadSWFMovie();
		} else {
			if (_global.slideNumber>13) {
				_global.splitStart = 14;
				_global.splitEnd = 26;
				_global.playSwfFileName = _global.tempURL+"/VB/"+_global.arrSection3_Details[_global.slideNumber];
				_root.doCreateSlide();
				_root.doPutBackAndFinished();
				_root.loadSWFMovie();
			} else {
				_global.splitStart = 2;
				_global.splitEnd = 13;
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
		if (_global.slideNumber > 14) {
			_global.splitStart = 15;
			_global.splitEnd = 28;
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
				if (_global.playSwfFileName != _global.tempURL+"/RW/L8RW01.swf" && _global.playSwfFileName != _global.tempURL+"/VB/L8VB01.swf" && _global.playSwfFileName != _global.tempURL+"/IN/L8IN01.swf" && _global.playSwfFileName != _global.tempURL+"/GS/L8GS01.swf" && _global.playSwfFileName != _global.tempURL+"/TI/L8TI01.swf" && _global.playSwfFileName != _global.tempURL+"/TS/L8TS01.swf") {
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
