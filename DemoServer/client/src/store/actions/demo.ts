import * as actionTypes from "./actionTypes";
import clipboardCopy = require("clipboard-copy");
import { DemoThunkAction } from ".";
import { apiError } from "./error";
import { DemoService, RunDemoService } from "../../utils/api/Services";
import { DemoContextDto } from "../../models/dtos/context";
import { toDemoParamsDto } from "../../models/demo";
import { DemoThunkDispatch } from "..";
import { FilesCache } from "../../utils/FilesCache";
import { FormFile } from "../../utils/api/ApiClient";
import { Progress } from "../../utils/localStorage/Progress";
import { selectDemoVersionInfo } from "../selectors/demos";
import { DemoDto } from "../../models/dtos/demo";
import { initTrackingData } from "./tracking";

const service = new DemoService();

export interface GetMetadataRequest {
    type: actionTypes.DEMO_GET_METADATA_REQUEST;
}

export interface GetMetadataFailure {
    type: actionTypes.DEMO_GET_METADATA_FAILURE;
    error: any;
}

export interface GetMetadataSuccess {
    type: actionTypes.DEMO_GET_METADATA_SUCCESS;
    result: DemoDto;
}

export interface SetPrerequisitesRequest {
    type: actionTypes.DEMO_SET_PREREQUISITES_REQUEST;
}

export interface SetPrerequisitesFailure {
    type: actionTypes.DEMO_SET_PREREQUISITES_FAILURE;
    error: any;
}

export interface SetPrerequisitesSuccess {
    type: actionTypes.DEMO_SET_PREREQUISITES_SUCCESS;
}

export interface RunDemoRequest {
    type: actionTypes.DEMO_RUN_REQUEST;
}

export interface RunDemoFailure {
    type: actionTypes.DEMO_RUN_FAILURE;
    error: any;
}

export interface RunDemoSuccess {
    type: actionTypes.DEMO_RUN_SUCCESS;
    results: object;
}

export interface HideResults {
    type: actionTypes.DEMO_HIDE_RESULTS;
}

export interface ToggleDemoShareMessage {
    type: actionTypes.DEMO_TOGGLE_SHARE_MESSAGE;
    show: boolean;
}

export interface GetContextRequest {
    type: actionTypes.DEMO_GET_CONTEXT_REQUEST;
}

export interface GetContextSuccess {
    type: actionTypes.DEMO_GET_CONTEXT_SUCCESS;
    result: DemoContextDto;
}

interface RefreshProgress {
    type: actionTypes.DEMO_REFRESH_PROGRESS;
}

export type DemoAction = GetMetadataRequest | GetMetadataFailure | GetMetadataSuccess
    | SetPrerequisitesRequest | SetPrerequisitesFailure | SetPrerequisitesSuccess
    | RunDemoRequest | RunDemoFailure | RunDemoSuccess
    | HideResults
    | ToggleDemoShareMessage
    | GetContextRequest | GetContextSuccess
    | RefreshProgress;

function getContextRequest(): GetContextRequest {
    return {
        type: "DEMO_GET_CONTEXT_REQUEST"
    };
}

function getContextSuccess(result: DemoContextDto): GetContextSuccess {
    return {
        type: "DEMO_GET_CONTEXT_SUCCESS",
        result
    };
}

export function refreshProgress(): RefreshProgress {
    return {
        type: "DEMO_REFRESH_PROGRESS"
    };
}

export function getContext(): DemoThunkAction {
    return async (dispatch: DemoThunkDispatch, getState) => {
        const state = getState();
        const { demos } = state;
        const { loadingContext, categoriesWithVersions: categories } = demos;

        if (loadingContext) {
            return;
        }

        if (!!categories && categories.length) {
            dispatch(refreshProgress());
            return;
        }

        dispatch(getContextRequest());

        try {
            const result = await service.getDemoContext();
            const { categoriesWithVersions, googleTagManagerContainerId } = result;

            Progress.updateDemoVersions(categoriesWithVersions);
            dispatch(getContextSuccess(result));
            dispatch(initTrackingData(googleTagManagerContainerId));
        } catch (error) {
            dispatch(apiError(error));
        }
    };
}

function getMetadataRequest(): GetMetadataRequest {
    return {
        type: "DEMO_GET_METADATA_REQUEST"
    };
}

function getMetadataFailure(error: any): GetMetadataFailure {
    return {
        type: "DEMO_GET_METADATA_FAILURE",
        error
    };
}

function getMetadataSuccess(result: DemoDto): GetMetadataSuccess {
    return {
        type: "DEMO_GET_METADATA_SUCCESS",
        result
    };
}

export function getMetadata(): DemoThunkAction {
    return async (dispatch: DemoThunkDispatch, getState) => {
        const { demos } = getState();
        const { language, categorySlug, demoSlug } = demos;

        dispatch(getMetadataRequest());

        try {
            const result = await service.getMetadata(language, categorySlug, demoSlug);
            dispatch(getMetadataSuccess(result));

            if (result.nonInteractive) {
                dispatch(setPrerequisitesSuccess());
            } else {
                dispatch(setPrerequisites());
            }
        } catch (error) {
            dispatch(apiError(error));
            dispatch(getMetadataFailure(error));
        }
    };
}

const createDemoService = (demoSlug: string) => new RunDemoService(demoSlug);

function setPrerequisitesRequest(): SetPrerequisitesRequest {
    return {
        type: "DEMO_SET_PREREQUISITES_REQUEST"
    };
}

function setPrerequisitesFailure(error: any): SetPrerequisitesFailure {
    return {
        type: "DEMO_SET_PREREQUISITES_FAILURE",
        error
    };
}

function setPrerequisitesSuccess(): SetPrerequisitesSuccess {
    return {
        type: "DEMO_SET_PREREQUISITES_SUCCESS"
    };
}

function setPrerequisites(): DemoThunkAction {
    return async (dispatch: DemoThunkDispatch, getState) => {
        const { demos } = getState();
        const { demoSlug, demo } = demos;

        if (demo.nonInteractive) {
            return;
        }

        dispatch(setPrerequisitesRequest());
        const demoService = createDemoService(demoSlug);
        try {
            await demoService.setPrerequisites();
            dispatch(setPrerequisitesSuccess());
        } catch (error) {
            dispatch(apiError(error));
            dispatch(setPrerequisitesFailure(error));
        }
    };
}

function runDemoRequest(): RunDemoRequest {
    return {
        type: "DEMO_RUN_REQUEST"
    };
}

function runDemoFailure(error: any): RunDemoFailure {
    return {
        type: "DEMO_RUN_FAILURE",
        error
    };
}

function runDemoSuccess(results: object): RunDemoSuccess {
    return {
        type: "DEMO_RUN_SUCCESS",
        results
    };
}

export function runDemo(): DemoThunkAction {
    return async (dispatch: DemoThunkDispatch, getState) => {
        const state = getState();
        const { demos, params } = state;
        const { demoSlug, demo } = demos;
        const { parameters, attachmentNamesToUpload } = params;

        if (demo.nonInteractive) {
            return;
        }

        const demoService = createDemoService(demoSlug);

        dispatch(runDemoRequest());
        try {
            const dto = toDemoParamsDto(parameters);
            let result: object = null;

            if (attachmentNamesToUpload.length > 0) {
                const fileEntries = FilesCache.getForKeys(attachmentNamesToUpload);

                const toUpload: FormFile[] = fileEntries.map(x => ({
                    name: x.key,
                    file: x.value
                }));

                result = await demoService.runWithFiles(dto, toUpload);
            } else {
                result = await demoService.run(dto);
            }

            const saveProgressParams = selectDemoVersionInfo(demos);
            Progress.save(saveProgressParams);

            dispatch(runDemoSuccess(result));
        } catch (error) {
            dispatch(apiError(error));
            dispatch(runDemoFailure(error));
        }
    };
}

export function hideResults(): HideResults {
    return {
        type: "DEMO_HIDE_RESULTS"
    };
}

export function toggleDemoShareMessage(show: boolean): ToggleDemoShareMessage {
    return {
        type: "DEMO_TOGGLE_SHARE_MESSAGE",
        show
    };
}

export function shareDemo(): DemoThunkAction {
    return async (dispatch: DemoThunkDispatch) => {
        clipboardCopy(window.location.href);
        dispatch(toggleDemoShareMessage(true));
    };
}
