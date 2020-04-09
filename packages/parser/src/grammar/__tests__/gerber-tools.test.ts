// gerber grammar tests
import {expect} from 'chai'
import {toArray} from 'lodash'

import * as Lexer from '../../lexer'
import * as Tree from '../../tree'
import {token as t, simplifyToken} from '../../__tests__/helpers'
import {grammar, matchGrammar, MatchState} from '..'

import {
  GERBER,
  CIRCLE,
  RECTANGLE,
  OBROUND,
  POLYGON,
  MACRO_SHAPE,
} from '../../constants'

const SPECS: Array<{
  source: string
  expectedTokens: Lexer.Token[]
  expectedNodes: Tree.ChildNode[]
}> = [
  {
    // simple circle tool
    source: '%ADD10C,.025*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '10C'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '.025'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '10',
        shape: {type: CIRCLE, diameter: 0.025},
        hole: null,
      },
    ],
  },
  {
    // circle tool with circular hole
    source: '%ADD11C,0.5X0.25*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '11C'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '0.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.25'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '11',
        shape: {type: CIRCLE, diameter: 0.5},
        hole: {type: CIRCLE, diameter: 0.25},
      },
    ],
  },
  {
    // circle tool with rectangular hole
    source: '%ADD12C,10X5X5*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '12C'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '10'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '5'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '12',
        shape: {type: CIRCLE, diameter: 10},
        hole: {type: RECTANGLE, xSize: 5, ySize: 5},
      },
    ],
  },
  {
    // rectangle tool definition with no hole
    source: '%ADD13R,0.5X0.6*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '13R'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '0.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.6'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '13',
        shape: {type: RECTANGLE, xSize: 0.5, ySize: 0.6},
        hole: null,
      },
    ],
  },
  {
    // rectangle tool definition with circle hole
    source: '%ADD14R,0.5X0.6X0.2*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '14R'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '0.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.6'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.2'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '14',
        shape: {type: RECTANGLE, xSize: 0.5, ySize: 0.6},
        hole: {type: CIRCLE, diameter: 0.2},
      },
    ],
  },
  {
    // rectangle tool definition with rectangle hole
    source: '%ADD15R,0.5X0.6X0.2X0.1*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '15R'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '0.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.6'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.2'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.1'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '15',
        shape: {type: RECTANGLE, xSize: 0.5, ySize: 0.6},
        hole: {type: RECTANGLE, xSize: 0.2, ySize: 0.1},
      },
    ],
  },
  {
    // obround tool definition with no hole
    source: '%ADD16O,0.5X0.6*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '16O'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '0.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.6'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '16',
        shape: {type: OBROUND, xSize: 0.5, ySize: 0.6},
        hole: null,
      },
    ],
  },
  {
    // obround tool definition with circle hole
    source: '%ADD17O,0.5X0.6X0.2*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '17O'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '0.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.6'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.2'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '17',
        shape: {type: OBROUND, xSize: 0.5, ySize: 0.6},
        hole: {type: CIRCLE, diameter: 0.2},
      },
    ],
  },
  {
    // obround tool definition with rectangle hole
    source: '%ADD18O,0.5X0.6X0.2X0.1*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '18O'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '0.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.6'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.2'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.1'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '18',
        shape: {type: OBROUND, xSize: 0.5, ySize: 0.6},
        hole: {type: RECTANGLE, xSize: 0.2, ySize: 0.1},
      },
    ],
  },
  {
    // polygon tool definition with no rotation and no hole
    source: '%ADD19P,1.5X3*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '19P'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '1.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '3'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '19',
        shape: {type: POLYGON, diameter: 1.5, vertices: 3, rotation: null},
        hole: null,
      },
    ],
  },
  {
    // polygon tool defintion with rotation and no hole
    source: '%ADD20P,2.5X4X12.5*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '20P'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '2.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '4'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '12.5'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '20',
        shape: {type: POLYGON, diameter: 2.5, vertices: 4, rotation: 12.5},
        hole: null,
      },
    ],
  },
  {
    // polygon tool definition with rotation and circle hole
    source: '%ADD21P,2.5X4X12.5X1*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '21P'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '2.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '4'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '12.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '1'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '21',
        shape: {type: POLYGON, diameter: 2.5, vertices: 4, rotation: 12.5},
        hole: {type: CIRCLE, diameter: 1},
      },
    ],
  },
  {
    // polygon tool definition with rotation and circle hole
    source: '%ADD22P,2.5X4X12.5X1X1.5*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '22P'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '2.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '4'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '12.5'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '1'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '1.5'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '22',
        shape: {type: POLYGON, diameter: 2.5, vertices: 4, rotation: 12.5},
        hole: {type: RECTANGLE, xSize: 1, ySize: 1.5},
      },
    ],
  },
  {
    // macro tool definition with no parameters
    source: '%ADD23MyMacro*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '23MyMacro'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '23',
        shape: {type: MACRO_SHAPE, name: 'MyMacro', params: []},
        hole: null,
      },
    ],
  },
  {
    // macro tool definition with parameters
    source: '%ADD24MyMacro,0.1X0.2X0.3*%',
    expectedTokens: [
      t(Lexer.PERCENT, '%'),
      t(Lexer.GERBER_TOOL_DEF, '24MyMacro'),
      t(Lexer.COMMA, ','),
      t(Lexer.NUMBER, '0.1'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.2'),
      t(Lexer.COORD_CHAR, 'X'),
      t(Lexer.NUMBER, '0.3'),
      t(Lexer.ASTERISK, '*'),
      t(Lexer.PERCENT, '%'),
    ],
    expectedNodes: [
      {
        type: Tree.TOOL_DEFINITION,
        code: '24',
        shape: {type: MACRO_SHAPE, name: 'MyMacro', params: [0.1, 0.2, 0.3]},
        hole: null,
      },
    ],
  },
]

describe('gerber tool grammar matches', () => {
  SPECS.forEach(({source, expectedTokens, expectedNodes}) => {
    it(`should match on ${source.trim()}`, () => {
      const lexer = Lexer.createLexer()
      lexer.reset(source)

      const actualTokens = toArray((lexer as unknown) as Array<Lexer.Token>)
      const {tokens, nodes, filetype} = actualTokens.reduce<MatchState>(
        (state, token) => matchGrammar(state, token, grammar),
        null
      )

      expect(filetype).to.equal(GERBER)
      expect(nodes).to.eql(expectedNodes)
      expect(tokens.map(simplifyToken)).to.eql(
        expectedTokens.map(simplifyToken)
      )
    })
  })
})