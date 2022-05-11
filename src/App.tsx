import React from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import * as Diff from 'diff';
import * as Automerge from 'automerge'
import './App.css';

// state of text field
let initial = '';
let user1 = '';
let user2 = '';

function MyField(
  {
    fieldLabel,
    fieldValue,
    handleChange
  }:
    {
      fieldLabel: string,
      fieldValue: string,
      handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void
    }
) {
  return (
    <TextField
      fullWidth
      id="outlined-multiline-static"
      label={fieldLabel}
      multiline
      rows={4}
      value={fieldValue}
      onChange={handleChange}
    />
  );
}

function MyResultDisplay({textContent}: { textContent: string }) {
  return <Paper variant="outlined" className="MyPaper">
    <pre>
      {textContent}
    </pre>
  </Paper>
}

function App() {
  // state of result boxes
  const [user1result, setUser1Result] = React.useState('');
  const [user2result, setUser2Result] = React.useState('');

  // state of user-modifiable fields
  // we need to be able to set the value of user1FieldValue and user2FieldValue in response to changes to initialFieldValue
  const [initialFieldValue, setInitialFieldValue] = React.useState('');
  const [user1FieldValue, setUser1FieldValue] = React.useState('');
  const [user2FieldValue, setUser2FieldValue] = React.useState('');

  // visibility of additional info paragraphs
  const [isInfoVisible, setIsInfoVisible] = React.useState(false);

  // compute changes between initialText and finalText using diff,
  // then perform those changes on the Automerge.Text object in doc, and return it
  function doMagic(initialText: string, finalText: string, doc: any): any {
    // compute changes using diff
    let diff1 = Diff.diffChars(initialText, finalText);

    let pos = 0;
    let posBackwards = initial.length;

    // traverse the changes in the forward direction, performing any additions on doc
    // also use posBackwards to store the resulting length (with all the additions performed)
    for (let part of diff1) {
      if (part.added) {
        doc = Automerge.change(doc, (doc: any) => {
          doc.text.insertAt(pos, ...part.value);
        });
        // console.log("added string", part.value, "at", pos.toString());
        posBackwards += part.value.length;
      }
      pos += part.value.length;
    }

    // traverse the changes in the backward direction, performing any deletions on doc
    for (let part of diff1.reverse()) {
      posBackwards -= part.value.length;
      if (part.removed) {
        doc = Automerge.change(doc, (doc: any) => {
          doc.text.deleteAt(posBackwards, part.value.length);
        });
        // console.log("removed", part.value.length, "chars at", posBackwards);
      }
    }

    return doc;
  }

  function runAutomerge() {
    // TODO: implement debug window so we can see what the algorithms see as input
    // doc1.text.toString() and (doc1.text.toString() === user1) can be used to identify whether
    // doMagic is doing its job properly for this particular input - that equality should ALWAYS hold
    // console.log(initial);
    // console.log(user1);
    // console.log(user2);

    // start off with the same initial text
    let doc1 = Automerge.change(Automerge.init(), (doc: any) => {
      doc.text = new Automerge.Text(initial)
    });
    let doc2 = Automerge.merge(Automerge.init(), doc1);

    // perform relevant changes on both docs independently
    doc1 = doMagic(initial, user1, doc1);
    doc2 = doMagic(initial, user2, doc2);

    // merge the two documents one way, and then the other
    // TODO: is there anything I can do about the typescript errors here rather than ignoring them?
    // @ts-ignore
    setUser1Result(Automerge.merge(Automerge.clone(doc1), Automerge.clone(doc2)).text.toString());
    // @ts-ignore
    setUser2Result(Automerge.merge(Automerge.clone(doc2), Automerge.clone(doc1)).text.toString());
  }

  return (
    <div className='App'>
      <h1>Automerge Playground</h1>
      <div className='Intro'>
        <p>
          This webpage allows you to experiment with the Automerge.Text sync protocol. It simulates the scenario of two
          users working on a text document concurrently, which is then synced to merge both their changes. The protocol
          used by Automerge.Text is itself a variant of the RGA/Causal Trees algorithm (see <a
          href='http://csl.snu.ac.kr/papers/jpdc11.pdf'>this paper</a> and <a
          href='https://web.archive.org/web/20170821171430/http://www.ds.ewi.tudelft.nl/~victor/polo.pdf'>this paper</a>).
        </p>
        <p>
          <a href='https://github.com/CicadaCinema/automerge-playground'>Source code</a>
        </p>
      </div>
      <div className={'MarginBottom'}>
        <Button
          variant="outlined"
          onClick={() => {
            setIsInfoVisible(!isInfoVisible);
          }}
        >
          {isInfoVisible ? 'Hide more' : 'Show more'}
        </Button>

      </div>
      {isInfoVisible && <div className='Intro'>

        <h2>Usage</h2>
        <ol>
          <li>
            Enter some text in the first text field. This represents the initial state of the document. The two text
            fields below should populate themselves with the same text.<br/>For example, try entering "Hello!".
          </li>
          <li>
            Modify the contents of the two fields below. This represents the two users making changes to the document
            independently of one another.<br/>For example, try entering "Hello World!" and "Hello! :-)".
          </li>
          <li>
            Observe the merged document text at the bottom of the page. Each of the user's changes should be
            incorporated into the final document.<br/>Following the example above, the result should be "Hello World!
            :-)".
          </li>
        </ol>

        <h2>Note</h2>
        <p>
          It doesn't matter <i>how</i> or <i>in what order</i> the changes in each of the user's text fields are made.
          The shortest edit script between the initial document text and each of the user's modified documents is
          computed on the fly using <a href='http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927'>the O(ND)
          Difference Algorithm</a> proposed by Eugene Myers. This means that the final merged document is generated
          deterministically, regardless of what operations you perform with your cursor and keyboard.
        </p>
        <br/>
      </div>}

      <Grid container spacing={2} columns={2}>
        <Grid item xs={2}>
          <MyField fieldLabel={'Initial text'} fieldValue={initialFieldValue} handleChange={
            (event: React.ChangeEvent<HTMLInputElement>) => {
              initial = event.target.value;
              // if the contents of initial and user1 text fields were the same before this event,
              // then make user1 copy initial
              if (initialFieldValue === user1FieldValue) {
                user1 = initial;
                setUser1FieldValue(initial);
              }
              // likewise for user2
              if (initialFieldValue === user2FieldValue) {
                user2 = initial;
                setUser2FieldValue(initial);
              }
              setInitialFieldValue(initial);
              runAutomerge();
            }
          }/>
        </Grid>
        <Grid item xs={1}>
          <MyField fieldLabel={"User 1's changes"} fieldValue={user1FieldValue} handleChange={
            (event: React.ChangeEvent<HTMLInputElement>) => {
              user1 = event.target.value;
              setUser1FieldValue(user1);
              runAutomerge();
            }
          }/>
        </Grid>
        <Grid item xs={1}>
          <MyField fieldLabel={"User 2's changes"} fieldValue={user2FieldValue} handleChange={
            (event: React.ChangeEvent<HTMLInputElement>) => {
              user2 = event.target.value;
              setUser2FieldValue(user2);
              runAutomerge();
            }
          }/>
        </Grid>
        {
          user1result === user2result
            ? <>
              {user1result !== '' && <Grid item xs={2}>
                <h2>Merge successful!</h2>
                <MyResultDisplay textContent={user1result}/>
              </Grid>}
            </>
            : <>
              <Grid item xs={2}>
                <h2>Merge failed!</h2>
              </Grid>
              <Grid item xs={1}>
                <h2>{"User 1 <- User 2"}</h2>
                <MyResultDisplay textContent={user1result}/>
              </Grid>
              <Grid item xs={1}>
                <h2>{"User 2 <- User 1"}</h2>
                <MyResultDisplay textContent={user2result}/>
              </Grid>
            </>
        }
      </Grid>
    </div>
  );
}

export default App;
