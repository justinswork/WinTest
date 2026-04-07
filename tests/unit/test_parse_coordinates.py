"""Tests for ShowUIModel.parse_coordinates — coordinate extraction from model output."""

import pytest

from wintest.core.vision.showui import ShowUIModel


class TestParseCoordinates:
    """Test the coordinate parser for ShowUI's [x, y] output format (0-1 scale)."""

    def test_typical_output(self):
        assert ShowUIModel.parse_coordinates("[0.73, 0.21]") == (730, 210)

    def test_center(self):
        assert ShowUIModel.parse_coordinates("[0.5, 0.5]") == (500, 500)

    def test_top_left(self):
        assert ShowUIModel.parse_coordinates("[0.0, 0.0]") == (0, 0)

    def test_bottom_right(self):
        assert ShowUIModel.parse_coordinates("[1.0, 1.0]") == (1000, 1000)

    def test_small_values(self):
        assert ShowUIModel.parse_coordinates("[0.01, 0.02]") == (10, 20)

    def test_no_leading_zero(self):
        assert ShowUIModel.parse_coordinates("[.5, .3]") == (500, 300)

    def test_with_whitespace(self):
        assert ShowUIModel.parse_coordinates("  [0.73, 0.21]  ") == (730, 210)

    def test_embedded_in_text(self):
        assert ShowUIModel.parse_coordinates(
            "The click location is [0.25, 0.75]"
        ) == (250, 750)

    def test_no_coordinates(self):
        assert ShowUIModel.parse_coordinates("no coordinates here") is None

    def test_empty_string(self):
        assert ShowUIModel.parse_coordinates("") is None

    def test_verbose_refusal(self):
        assert ShowUIModel.parse_coordinates(
            "I cannot find the element you described."
        ) is None

    def test_out_of_range(self):
        assert ShowUIModel.parse_coordinates("[1.5, 0.5]") is None

    def test_negative(self):
        assert ShowUIModel.parse_coordinates("[-0.1, 0.5]") is None
