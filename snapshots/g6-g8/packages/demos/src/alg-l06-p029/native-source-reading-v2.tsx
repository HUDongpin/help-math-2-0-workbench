import React from 'react';
import {P029FeedbackReadableNativeV1,
  type P029FeedbackReadableNativeProps}
 from './feedback-readable-native-v1';
import {p029MainReadingV1} from './main-reading-v1';

/** Adds the source frame-146 read-only answer and postquiz pair sequence to
 * the single existing readable/native action surface. The Canvas is untouched. */
export function P029NativeSourceReadingV2(props:P029FeedbackReadableNativeProps){
  const main=p029MainReadingV1(props.state);
  return <div data-p029-native-source-reading="true"
    data-p029-main-emphasis={main.sourceEmphasis??''}
    style={{width:'100%',minWidth:0,maxWidth:'100%'}}>
    <P029FeedbackReadableNativeV1 {...props}/>
    {main.answer&&<section lang="en" aria-label="Post-quiz answer"
      data-p029-postquiz-reading="true"
      style={{padding:'0.5em 0.75em',fontSize:'1rem',lineHeight:1.4,
        minWidth:0,overflowWrap:'normal'}}>
      <p data-source-text-id={main.answer.textId}
        data-source-edit-text-id={main.answer.editTextId}
        style={{margin:'0 0 0.5em'}}>{main.answer.label}{' '}
        <output>{main.answer.value}</output></p>
      {main.seenOrderedPairs.length>0&&<div>
        <p style={{margin:'0 0 0.25em'}}>Ordered pairs</p>
        <ol aria-live="polite" aria-relevant="additions"
          aria-label="Ordered pairs shown in the animation"
          style={{margin:0,paddingInlineStart:'1.5em'}}>
          {main.seenOrderedPairs.map(pair=><li key={pair.textId}
            data-source-text-id={pair.textId}
            data-source-first-frame={pair.firstFrame}>{pair.text}</li>)}
        </ol>
      </div>}
    </section>}
  </div>;
}
