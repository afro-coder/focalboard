// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
console.log = jest.fn()

import 'isomorphic-fetch'
import {TestBlockFactory} from '../test/block'
import {FetchMock} from '../test/fetchMock'

import {MutableWorkspaceTree} from './workspaceTree'

global.fetch = FetchMock.fn

beforeEach(() => {
    FetchMock.fn.mockReset()
})

test('WorkspaceTree', async () => {
    const board = TestBlockFactory.createBoard()
    const boardTemplate = TestBlockFactory.createBoard()
    boardTemplate.isTemplate = true
    const view = TestBlockFactory.createBoardView()

    // Sync
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([board, boardTemplate])))
    FetchMock.fn.mockReturnValueOnce(FetchMock.jsonResponse(JSON.stringify([view])))
    const workspaceTree = new MutableWorkspaceTree()
    await workspaceTree.sync()

    expect(FetchMock.fn).toBeCalledTimes(2)
    expect(workspaceTree.boards).toEqual([board])
    expect(workspaceTree.boardTemplates).toEqual([boardTemplate])
    expect(workspaceTree.views).toEqual([view])

    // Incremental update
    const board2 = TestBlockFactory.createBoard()
    const boardTemplate2 = TestBlockFactory.createBoard()
    boardTemplate2.isTemplate = true
    const view2 = TestBlockFactory.createBoardView()

    expect(workspaceTree.incrementalUpdate([board2, boardTemplate2, view2])).toBe(true)
    expect(workspaceTree.boards).toEqual([board, board2])
    expect(workspaceTree.boardTemplates).toEqual([boardTemplate, boardTemplate2])
    expect(workspaceTree.views).toEqual([view, view2])

    // Incremental update: No change
    const card = TestBlockFactory.createCard()
    expect(workspaceTree.incrementalUpdate([card])).toBe(false)
    expect(workspaceTree.boards).toEqual([board, board2])
    expect(workspaceTree.boardTemplates).toEqual([boardTemplate, boardTemplate2])
    expect(workspaceTree.views).toEqual([view, view2])

    // Copy
    const workspaceTree2 = workspaceTree.mutableCopy()
    expect(workspaceTree2).toEqual(workspaceTree)
    expect(workspaceTree2.boards).toEqual(workspaceTree.boards)
    expect(workspaceTree2.boardTemplates).toEqual(workspaceTree.boardTemplates)
    expect(workspaceTree2.views).toEqual(workspaceTree.views)
})
